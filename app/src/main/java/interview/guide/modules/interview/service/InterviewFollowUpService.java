package interview.guide.modules.interview.service;

import interview.guide.common.ai.LlmProviderRegistry;
import interview.guide.common.ai.StructuredOutputInvoker;
import interview.guide.common.exception.ErrorCode;
import interview.guide.modules.interview.model.InterviewQuestionDTO;
import interview.guide.modules.interview.skill.InterviewSkillService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.prompt.PromptTemplate;
import org.springframework.ai.converter.BeanOutputConverter;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class InterviewFollowUpService {

    private final LlmProviderRegistry llmProviderRegistry;
    private final InterviewSkillService skillService;
    private final PromptTemplate systemPromptTemplate;
    private final PromptTemplate userPromptTemplate;
    private final BeanOutputConverter<FollowUpDecisionDTO> outputConverter;
    private final int maxFollowUpCount;
    private final StructuredOutputInvoker structuredOutputInvoker;

    private record FollowUpDecisionDTO(String decision, String question) {}

    public record FollowUpDecision(String decision, String question) {
        public boolean shouldFollowUp() {
            return "FOLLOW_UP".equalsIgnoreCase(decision) && question != null && !question.isBlank();
        }
    }

    public InterviewFollowUpService(
        LlmProviderRegistry llmProviderRegistry,
        InterviewSkillService skillService,
        InterviewQuestionProperties properties,
        StructuredOutputInvoker structuredOutputInvoker,
        ResourceLoader resourceLoader
    ) throws IOException {
        this.llmProviderRegistry = llmProviderRegistry;
        this.skillService = skillService;
        this.structuredOutputInvoker = structuredOutputInvoker;
        this.maxFollowUpCount = Math.max(0, Math.min(properties.getFollowUpCount(), 2));
        this.systemPromptTemplate = new PromptTemplate(
            resourceLoader.getResource(properties.getFollowUpDecisionSystemPromptPath())
                .getContentAsString(StandardCharsets.UTF_8)
        );
        this.userPromptTemplate = new PromptTemplate(
            resourceLoader.getResource(properties.getFollowUpDecisionUserPromptPath())
                .getContentAsString(StandardCharsets.UTF_8)
        );
        this.outputConverter = new BeanOutputConverter<>(FollowUpDecisionDTO.class);
    }

    public int getMaxFollowUpCount() {
        return maxFollowUpCount;
    }

    public FollowUpDecision decide(
        String llmProvider,
        String skillId,
        InterviewQuestionDTO currentQuestion,
        InterviewQuestionDTO mainQuestion,
        String candidateAnswer,
        int askedFollowUpCount,
        String recentContext,
        String resumeText
    ) {
        if (askedFollowUpCount >= maxFollowUpCount) {
            return new FollowUpDecision("NEXT_MAIN", null);
        }

        String skillName = skillId;
        String skillDescription = "";
        try {
            InterviewSkillService.SkillDTO skill = skillService.getSkill(skillId);
            skillName = skill.name();
            skillDescription = skill.description() != null ? skill.description() : "";
        } catch (Exception e) {
            log.warn("加载 Skill 失败，使用默认名称继续追问决策: skillId={}, error={}", skillId, e.getMessage());
        }

        Map<String, Object> variables = new HashMap<>();
        variables.put("skillName", skillName);
        variables.put("skillDescription", skillDescription);
        variables.put("currentQuestion", currentQuestion.question());
        variables.put("candidateAnswer", candidateAnswer);
        variables.put("askedFollowUpCount", askedFollowUpCount);
        variables.put("maxFollowUpCount", maxFollowUpCount);
        variables.put("recentContext", recentContext == null || recentContext.isBlank() ? "无" : recentContext);
        variables.put("resumeText", resumeText == null || resumeText.isBlank() ? "无" : resumeText);

        String systemPrompt = systemPromptTemplate.render() + "\n\n" + outputConverter.getFormat();
        String userPrompt = userPromptTemplate.render(variables);

        ChatClient chatClient = llmProviderRegistry.getPlainChatClient(llmProvider);
        FollowUpDecisionDTO dto = structuredOutputInvoker.invoke(
            chatClient,
            systemPrompt,
            userPrompt,
            outputConverter,
            ErrorCode.INTERVIEW_QUESTION_GENERATION_FAILED,
            "实时追问决策失败：",
            "实时追问决策",
            log
        );

        if (dto == null || dto.decision() == null || dto.decision().isBlank()) {
            return new FollowUpDecision("NEXT_MAIN", null);
        }

        if (!"FOLLOW_UP".equalsIgnoreCase(dto.decision())) {
            return new FollowUpDecision("NEXT_MAIN", null);
        }

        if (dto.question() == null || dto.question().isBlank()) {
            return new FollowUpDecision("NEXT_MAIN", null);
        }

        return new FollowUpDecision("FOLLOW_UP", dto.question().trim());
    }

    public String buildRecentContext(List<InterviewQuestionDTO> questions, int currentIndex) {
        int start = Math.max(0, currentIndex - 2);
        StringBuilder sb = new StringBuilder();
        for (int i = start; i <= currentIndex && i < questions.size(); i++) {
            InterviewQuestionDTO question = questions.get(i);
            sb.append("问题：").append(question.question()).append('\n');
            if (question.userAnswer() != null && !question.userAnswer().isBlank()) {
                sb.append("回答：").append(question.userAnswer()).append('\n');
            }
        }
        return sb.toString().trim();
    }
}
