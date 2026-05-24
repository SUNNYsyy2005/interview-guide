package interview.guide.common.ai;

import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Tags;
import interview.guide.common.exception.BusinessException;
import interview.guide.common.exception.ErrorCode;
import org.slf4j.Logger;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.converter.BeanOutputConverter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.Locale;
import java.util.regex.Pattern;

/**
 * 统一封装结构化输出调用与重试策略。
 */
@Component
public class StructuredOutputInvoker {

    private static final String STRICT_JSON_INSTRUCTION = """
请仅返回可被 JSON 解析器直接解析的 JSON 对象，并严格满足字段结构要求：
1) 不要输出 Markdown 代码块（如 ```json）。
2) 不要输出任何解释文字、前后缀、注释。
3) 所有字符串内引号必须正确转义。
    """;

    private static final String METRIC_INVOCATIONS = "app.ai.structured_output.invocations";
    private static final String METRIC_ATTEMPTS = "app.ai.structured_output.attempts";
    private static final String METRIC_LATENCY = "app.ai.structured_output.latency";
    private static final String STATUS_SUCCESS = "success";
    private static final String STATUS_FAILURE = "failure";
    private static final int MAX_CONTEXT_TAG_LENGTH = 48;
    private static final Pattern NON_ALNUM_PATTERN = Pattern.compile("[^a-z0-9_]+");
    private static final Pattern MULTI_UNDERSCORE = Pattern.compile("_+");

    private final int maxAttempts;
    private final boolean includeLastErrorInRetryPrompt;
    private final boolean retryUseRepairPrompt;
    private final boolean retryAppendStrictJsonInstruction;
    private final int errorMessageMaxLength;
    private final boolean metricsEnabled;
    private final MeterRegistry meterRegistry;

    public StructuredOutputInvoker(
        StructuredOutputProperties properties,
        @Autowired(required = false) MeterRegistry meterRegistry
    ) {
        this.maxAttempts = Math.max(1, properties.getStructuredMaxAttempts());
        this.includeLastErrorInRetryPrompt = properties.isStructuredIncludeLastError();
        this.retryUseRepairPrompt = properties.isStructuredRetryUseRepairPrompt();
        this.retryAppendStrictJsonInstruction = properties.isStructuredRetryAppendStrictJsonInstruction();
        this.errorMessageMaxLength = Math.max(20, properties.getStructuredErrorMessageMaxLength());
        this.metricsEnabled = properties.isStructuredMetricsEnabled();
        this.meterRegistry = meterRegistry;
    }

    public <T> T invoke(
        ChatClient chatClient,
        String systemPromptWithFormat,
        String userPrompt,
        BeanOutputConverter<T> outputConverter,
        ErrorCode errorCode,
        String errorPrefix,
        String logContext,
        Logger log
    ) {
        long startNanos = System.nanoTime();
        String contextTag = normalizeContextTag(logContext);
        String securedSystemPrompt = systemPromptWithFormat
            + PromptSecurityConstants.ANTI_INJECTION_INSTRUCTION;
        Exception lastError = null;
        for (int attempt = 1; attempt <= maxAttempts; attempt++) {
            String attemptSystemPrompt = attempt == 1
                ? securedSystemPrompt
                : buildRetrySystemPrompt(securedSystemPrompt, lastError);
            try {
                String content = chatClient.prompt()
                    .system(attemptSystemPrompt)
                    .user(userPrompt)
                    .call()
                    .content();
                T result = convertWithRepair(content, outputConverter, logContext, log);
                recordAttempt(contextTag, STATUS_SUCCESS);
                recordInvocation(contextTag, STATUS_SUCCESS, startNanos);
                return result;
            } catch (Exception e) {
                lastError = e;
                recordAttempt(contextTag, STATUS_FAILURE);
                if (attempt < maxAttempts) {
                    log.warn("{}结构化解析失败，准备重试: attempt={}/{}, error={}",
                        logContext, attempt, maxAttempts, e.getMessage());
                } else {
                    log.error("{}结构化解析失败，已达最大重试次数: attempts={}, error={}",
                        logContext, maxAttempts, e.getMessage());
                }
            }
        }

        recordInvocation(contextTag, STATUS_FAILURE, startNanos);
        throw new BusinessException(
            errorCode,
            errorPrefix + (lastError != null ? lastError.getMessage() : "unknown")
        );
    }

    private <T> T convertWithRepair(
        String content,
        BeanOutputConverter<T> outputConverter,
        String logContext,
        Logger log
    ) {
        // 1. 先去除可能的 Markdown 代码块包裹
        String cleaned = stripMarkdownCodeFences(content);

        // 1.5 去除重复 JSON key（AI 有时返回多个同名字段）
        cleaned = deduplicateJsonKeys(cleaned);

        // 1.6 将 JSON 数组中的对象值转为字符串（AI 有时返回结构化对象而非字符串）
        cleaned = flattenArrayObjectsToStrings(cleaned);

        // 2. 直接尝试解析
        try {
            return outputConverter.convert(cleaned);
        } catch (Exception firstError) {
            // 3. 尝试修复未转义引号后重新解析
            String repaired = repairUnescapedQuotesInJsonStrings(cleaned);
            if (!repaired.equals(cleaned)) {
                try {
                    T result = outputConverter.convert(repaired);
                    log.warn("{}结构化 JSON 存在未转义引号，已在本地修复后解析成功", logContext);
                    return result;
                } catch (Exception repairError) {
                    firstError.addSuppressed(repairError);
                }
            }

            // 4. 最后兜底：去掉所有换行后重试（有时 AI 返回的 JSON 包含真实换行符）
            try {
                String flattened = repaired.replace("\n", "\\n").replace("\r", "");
                T result = outputConverter.convert(flattened);
                log.warn("{}结构化 JSON 存在未转义换行符，已在本地修复后解析成功", logContext);
                return result;
            } catch (Exception e) {
                // 忽略，抛出原始错误
            }

            throw firstError;
        }
    }

    /**
     * 去除 AI 输出中可能的 Markdown 代码块包裹
     */
    private String stripMarkdownCodeFences(String content) {
        if (content == null) return null;
        String trimmed = content.strip();
        // 处理 ```json ... ``` 或 ``` ... ```
        if (trimmed.startsWith("```")) {
            int firstNewline = trimmed.indexOf('\n');
            if (firstNewline > 0) {
                trimmed = trimmed.substring(firstNewline + 1);
            }
            if (trimmed.endsWith("```")) {
                trimmed = trimmed.substring(0, trimmed.length() - 3);
            }
            trimmed = trimmed.strip();
        }
        return trimmed;
    }

    /**
     * 去除 JSON 中的重复 key，将重复 key 的值合并为数组。
     * AI 有时返回多个同名字段（如多个 "strengths": [...]），Jackson 反序列化 record 时会报错。
     */
    private String deduplicateJsonKeys(String json) {
        if (json == null || json.isBlank()) return json;
        if (!hasDuplicateKeys(json)) {
            return json;  // 没有重复 key，原样返回
        }
        try {
            // 有重复 key，用 readTree 只保留最后一个值（比解析失败好）
            com.fasterxml.jackson.databind.ObjectMapper mapper =
                new com.fasterxml.jackson.databind.ObjectMapper();
            com.fasterxml.jackson.databind.JsonNode tree = mapper.readTree(json);
            return mapper.writeValueAsString(tree);
        } catch (Exception e) {
            return json;
        }
    }

    /**
     * 快速检测 JSON 字符串中是否有重复 key
     */
    private boolean hasDuplicateKeys(String json) {
        try {
            // 用 Jackson 的 STRICT_DUPLICATE_DETECTION 检测
            com.fasterxml.jackson.core.JsonFactory factory = new com.fasterxml.jackson.core.JsonFactory();
            factory.configure(com.fasterxml.jackson.core.JsonParser.Feature.STRICT_DUPLICATE_DETECTION, true);
            com.fasterxml.jackson.core.JsonParser parser = factory.createParser(json);
            while (parser.nextToken() != null) {
                // 遍历所有 token，如果遇到重复 key 会抛 JsonParseException
            }
            parser.close();
            return false;
        } catch (com.fasterxml.jackson.core.JsonParseException e) {
            if (e.getMessage() != null && e.getMessage().contains("Duplicate")) {
                return true;
            }
            return false;
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * 将 JSON 数组中的对象值转为字符串。
     * AI 有时按 prompt 要求返回结构化对象（如 {"taskName":"...", "why":"..."}），
     * 但 DTO 定义为 List&lt;String&gt;，导致 Jackson 反序列化失败。
     * 此方法遍历 JSON 树，将包含对象的数组中的对象序列化为 JSON 字符串。
     */
    private String flattenArrayObjectsToStrings(String json) {
        if (json == null || json.isBlank()) return json;
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper =
                new com.fasterxml.jackson.databind.ObjectMapper();
            com.fasterxml.jackson.databind.JsonNode tree = mapper.readTree(json);
            boolean modified = flattenNode(tree, mapper);
            return modified ? mapper.writeValueAsString(tree) : json;
        } catch (Exception e) {
            return json;
        }
    }

    /**
     * 递归遍历 JSON 树，将包含对象元素的数组中的对象转为 JSON 字符串。
     * 只处理混合了对象和字符串的数组，纯字符串数组不动。
     */
    private boolean flattenNode(com.fasterxml.jackson.databind.JsonNode node,
                                com.fasterxml.jackson.databind.ObjectMapper mapper) {
        if (node.isObject()) {
            boolean modified = false;
            var fields = node.fields();
            while (fields.hasNext()) {
                var entry = fields.next();
                if (flattenNode(entry.getValue(), mapper)) {
                    modified = true;
                }
            }
            return modified;
        }
        if (node.isArray()) {
            boolean hasObject = false;
            boolean hasString = false;
            for (var child : node) {
                if (child.isObject()) hasObject = true;
                if (child.isTextual()) hasString = true;
            }
            // 如果数组中混有对象和字符串，或者全是对象，把对象转为字符串
            if (hasObject) {
                var array = (com.fasterxml.jackson.databind.node.ArrayNode) node;
                for (int i = 0; i < array.size(); i++) {
                    var child = array.get(i);
                    if (child.isObject()) {
                        try {
                            String str = mapper.writeValueAsString(child);
                            array.set(i, mapper.getNodeFactory().textNode(str));
                        } catch (Exception ignored) {}
                    }
                }
                return true;
            }
            // 纯字符串数组，递归检查子节点（虽然字符串没有子节点）
            return false;
        }
        return false;
    }

    private String repairUnescapedQuotesInJsonStrings(String content) {
        if (content == null || content.isBlank()) {
            return content;
        }
        StringBuilder repaired = new StringBuilder(content.length() + 16);
        boolean inString = false;
        boolean escaping = false;
        for (int i = 0; i < content.length(); i++) {
            char ch = content.charAt(i);
            if (!inString) {
                if (ch == '"') {
                    inString = true;
                }
                repaired.append(ch);
                continue;
            }

            if (escaping) {
                repaired.append(ch);
                escaping = false;
                continue;
            }
            if (ch == '\\') {
                repaired.append(ch);
                escaping = true;
                continue;
            }
            if (ch == '"') {
                if (isLikelyJsonStringTerminator(content, i + 1)) {
                    inString = false;
                    repaired.append(ch);
                } else {
                    repaired.append("\\\"");
                }
                continue;
            }
            repaired.append(ch);
        }
        return repaired.toString();
    }

    private boolean isLikelyJsonStringTerminator(String content, int start) {
        for (int i = start; i < content.length(); i++) {
            char next = content.charAt(i);
            if (Character.isWhitespace(next)) {
                continue;
            }
            // JSON 结构字符：一定是字符串终止符
            if (next == ',' || next == '}' || next == ']' || next == ':') {
                return true;
            }
            // 另一个字符串开始：也是终止符（当前字符串已结束）
            if (next == '"') {
                return true;
            }
            // 中文/日文/韩文字符紧跟在引号后面 → 说明这个引号是嵌入的，不是终止符
            // 例如: "存在"冷场"的习惯" 中 "冷" 前面的 " 是嵌入引号
            if (next >= 0x4E00 && next <= 0x9FFF) {
                return false;
            }
            // 英文字母或数字紧跟 → 也可能是嵌入引号
            if (Character.isLetterOrDigit(next)) {
                return false;
            }
            // 其他字符（标点等）：保守判断为终止符
            return true;
        }
        return true;
    }

    private String buildRetrySystemPrompt(String systemPromptWithFormat, Exception lastError) {
        if (!retryUseRepairPrompt) {
            return systemPromptWithFormat;
        }

        StringBuilder prompt = new StringBuilder(systemPromptWithFormat)
            .append("\n\n");

        if (retryAppendStrictJsonInstruction) {
            prompt.append(STRICT_JSON_INSTRUCTION).append('\n');
        }
        prompt.append("上次输出解析失败，请仅返回合法 JSON。");

        if (includeLastErrorInRetryPrompt && lastError != null && lastError.getMessage() != null) {
            prompt.append("\n上次失败原因：")
                .append(sanitizeErrorMessage(lastError.getMessage()));
        }
        return prompt.toString();
    }

    private String sanitizeErrorMessage(String message) {
        String oneLine = message.replace('\n', ' ').replace('\r', ' ').trim();
        if (oneLine.length() > errorMessageMaxLength) {
            return oneLine.substring(0, errorMessageMaxLength) + "...";
        }
        return oneLine;
    }

    private void recordAttempt(String contextTag, String status) {
        if (!isMetricsAvailable()) {
            return;
        }
        meterRegistry.counter(
            METRIC_ATTEMPTS,
            Tags.of("context", contextTag, "status", status)
        ).increment();
    }

    private void recordInvocation(String contextTag, String status, long startNanos) {
        if (!isMetricsAvailable()) {
            return;
        }
        Tags tags = Tags.of("context", contextTag, "status", status);
        meterRegistry.counter(METRIC_INVOCATIONS, tags).increment();
        meterRegistry.timer(METRIC_LATENCY, tags)
            .record(System.nanoTime() - startNanos, java.util.concurrent.TimeUnit.NANOSECONDS);
    }

    private boolean isMetricsAvailable() {
        return metricsEnabled && meterRegistry != null;
    }

    private String normalizeContextTag(String raw) {
        String source = (raw == null || raw.isBlank()) ? "unknown" : raw;
        String normalized = source.toLowerCase(Locale.ROOT).trim().replace(' ', '_');
        normalized = NON_ALNUM_PATTERN.matcher(normalized).replaceAll("_");
        normalized = MULTI_UNDERSCORE.matcher(normalized).replaceAll("_");
        normalized = normalized.replaceAll("^_+|_+$", "");
        if (normalized.isBlank()) {
            normalized = "unknown";
        }
        if (normalized.length() > MAX_CONTEXT_TAG_LENGTH) {
            normalized = normalized.substring(0, MAX_CONTEXT_TAG_LENGTH);
        }
        return normalized;
    }
}
