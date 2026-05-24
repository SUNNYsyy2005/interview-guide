# 大语言模型基础

## Transformer 架构
- 自注意力机制：Q/K/V 计算、缩放点积注意力、复杂度分析 O(n²d)
- 多头注意力：为什么多头、头数选择、注意力头可视化
- 位置编码：绝对/相对/RoPE/ALiBi 对比
- KV Cache：推理加速原理、显存占用计算
- MoE（混合专家）：路由机制、负载均衡

## 预训练与微调
- 预训练目标：CLM（GPT）vs MLM（BERT）vs Prefix LM
- 数据工程：数据清洗、去重、质量过滤、配比策略
- 全参数微调 vs LoRA/QLoRA：原理、显存对比、适用场景
- 指令微调：SFT 数据构造、对话模板、多轮训练
- RLHF/DPO/GRPO：奖励模型、PPO 训练、偏好对齐

## Prompt Engineering 与 Agent
- Prompt 技术：Few-shot、CoT、ToT、Self-Consistency
- Agent 架构：ReAct、Function Calling、Tool Use
- RAG：检索策略、重排序、HyDE、多路召回
- 上下文工程：长上下文处理、Lost in the Middle、压缩策略

## 推理优化与部署
- 量化：INT8/INT4/GPTQ/AWQ/GGUF 对比
- 推理加速：vLLM、TensorRT-LLM、Speculative Decoding
- 服务化：批处理、流式输出、并发控制
- 评估：MMLU/HumanEval/GSM8K/MT-Bench

## 安全与对齐
- 幻觉检测与缓解
- 越狱攻击与防御
- RLHF 中的 reward hacking
