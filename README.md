<div align="center">

# 保研预推免 AI 面试诊断与学习规划 Agent

基于大语言模型的 **保研预推免模拟面试、短板诊断、学习计划生成与复测闭环系统**

[![Java](https://img.shields.io/badge/Java-21-orange?logo=openjdk)](https://openjdk.org/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-4.0-green?logo=springboot)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-18.3-blue?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue?logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-pgvector-336791?logo=postgresql)](https://www.postgresql.org/)

</div>

---

## 项目介绍

本项目基于 `Snailclimb/interview-guide` 二次开发，当前版本聚焦 **保研夏令营 / 预推免 / 九推** 场景，不再把重点放在通用求职面试平台，而是升级为：

> **面向保研预推免学生的 AI 面试诊断与学习规划 Agent**

它不是简单的题库，也不是只会打分的模拟面试官，而是围绕用户的：

- 简历 / 项目经历
- 科研经历
- 目标方向
- 面试回答

完成一个更完整的闭环：

> 输入材料 → 场景化追问 → 暴露短板 → 诊断问题 → 生成学习计划 → 指定下一轮复测重点

当前版本的核心目标，是帮助学生解决这几个更真实的问题：

1. 学过课程知识，但不知道保研老师会怎样结合项目继续追问；
2. 有项目经历，但说不清个人贡献、技术选择、实验可信度和项目局限；
3. 对 baseline、ablation、metric、contribution 等科研表达理解不深；
4. 被问住后，不知道应该补什么、先补什么、怎么复测。

---

## 当前产品定位

相较于最初“AI 学长陪练”的定位，当前版本更强调 **诊断与学习规划**：

- 不是只问问题；
- 不是只给分；
- 而是通过模拟面试，识别用户在项目深层逻辑、科研表达、专业基础迁移、面试语境理解上的短板；
- 并把这些短板转化为可执行学习任务。

一句话概括：

> 让出题服务于诊断，让诊断服务于学习计划，让学习计划服务于下一轮复测。

---

## MVP 核心能力

### 1. 简历 / 项目材料输入

支持用户上传或输入：

- 简历文本 / 文件
- 项目经历
- 科研经历
- 目标方向

系统会基于这些材料启动后续面试与诊断流程。

### 2. 保研场景连续追问

系统会围绕用户回答进行多轮追问，重点暴露如下风险：

- 个人贡献不清
- baseline / metric / 数据集缺失
- 技术选择理由不足
- 项目结果缺少可信实验支撑
- 研究方向表达空泛
- 术语会说不会解释

### 3. 面试诊断报告

面试结束后，系统会输出更偏“诊断型”的结果，而不是普通技术面试评语。

重点包括：

- 本轮总体判断
- 多维度能力诊断
- 关键短板
- 高风险表达
- 可执行改进建议
- 下一轮复测重点

### 4. 学习计划生成

系统会将问题转化为具体任务，而不是泛泛建议。

例如：

- 今晚补哪些概念；
- 接下来 3 天应该重写哪些项目表述；
- 一周内如何完成复测与总结。

### 5. 复测闭环

下一轮面试可以继续围绕上一轮暴露的问题追问，避免每次都随机刷题。

---

## 当前重点场景

当前仓库已经优先收敛到保研预推免场景，主要适合：

- 计算机 / AI / 电子信息 / 自动化等理工科本科生
- 准备夏令营、预推免、九推面试的学生
- 已经有简历 / 项目经历，但缺少高频对练和具体反馈的用户

---

## 当前版本不重点做的功能

为了保证 MVP 可用、可演示、可快速迭代，当前版本**不把重心放在**以下功能：

- 完整院校数据库
- 大而全题库
- 正式面试实时辅助
- 复杂 RAG 联动主流程
- 语音 / 视频作为核心交互
- 通用招聘 / HR 场景首页入口

说明：

底层代码中仍保留了一些原项目能力（如语音、知识库、日历、多模型设置等），但当前产品主流程聚焦在：

> **文字模拟面试 + 短板诊断 + 学习计划 + 复测建议**

---

## 技术栈

### 后端

| 技术 | 版本 | 说明 |
|---|---:|---|
| Spring Boot | 4.0.1 | 应用框架 |
| Java | 21 | 开发语言 |
| Spring AI | 2.0.0-M4 | LLM 调用与结构化输出 |
| Spring AI Agent Utils | 0.7.0 | Skill 资源加载与 Agent 能力 |
| PostgreSQL + pgvector | 16 | 数据库存储与向量支持 |
| Redis + Redisson | 7 / 4.0.0 | 缓存与异步任务流 |
| Apache Tika | 2.9.2 | 文档解析 |
| AWS S3 SDK | 2.29.51 | MinIO / S3 兼容存储 |
| iText 8 | 8.0.5 | PDF 导出 |
| Gradle | 8.14 | 构建工具 |

### 前端

| 技术 | 版本 | 说明 |
|---|---:|---|
| React | 18.3 | UI 框架 |
| TypeScript | 5.6 | 开发语言 |
| Vite | 5.4 | 构建工具 |
| Tailwind CSS | 4.1 | 样式框架 |
| React Router | 7.11 | 路由管理 |
| Framer Motion | 12.23 | 动画 |
| Recharts | 3.6 | 图表 |
| pnpm | 10.26 | 包管理 |

---

## 关键设计理念

### 1. Prompt / Skill 驱动，而不是硬编码题库

当前系统大量依赖：

- `skills/baoyan-prescreen/SKILL.md`
- `prompts/interview-question-*.st`
- `prompts/interview-evaluation-*.st`

来决定：

- 问什么问题
- 如何追问
- 如何判断风险
- 如何输出报告

这样可以在不大改后端结构的情况下快速迭代产品逻辑。

### 2. 统一评估链路

文字面试与其他评估流程复用统一结构化评估能力，核心逻辑包括：

- 分批评估
- 结构化输出
- 二次汇总
- 降级兜底

这样能在 prompt 迭代时快速统一表现。

### 3. 保留原平台底座，但产品层收敛

当前版本的策略不是重构整个平台，而是：

- 底层保留原项目已有基础能力；
- 产品层聚焦保研主流程；
- 优先通过 prompt、Skill、展示层来完成差异化。

---

## 项目结构

```text
interview-guide/
├── app/
│   ├── src/main/java/interview/guide/
│   │   ├── common/                   # 通用 AI / 配置 / 评估 / 异步能力
│   │   ├── infrastructure/           # 文件、存储、导出、Redis 等基础设施
│   │   └── modules/
│   │       ├── interview/            # 模拟面试主流程
│   │       ├── llmprovider/          # 多模型 Provider 配置
│   │       ├── resume/               # 简历上传与分析
│   │       ├── knowledgebase/        # 原项目知识库能力（当前非主流程）
│   │       ├── interviewschedule/    # 原项目日历能力（当前非主流程）
│   │       └── voiceinterview/       # 原项目语音能力（当前非主流程）
│   └── src/main/resources/
│       ├── application.yml
│       ├── prompts/                  # 出题 / 评估 / 汇总提示词
│       ├── skills/                   # Skill 定义
│       └── scripts/
├── frontend/
│   └── src/
│       ├── api/
│       ├── components/
│       ├── hooks/
│       ├── pages/
│       └── utils/
├── docker-compose.yml
├── docker-compose.dev.yml
├── .env.example
└── README.md
```

---

## 本地开发（推荐）

当前最适合本项目的开发方式是：

- **Docker 只启动依赖服务**
- **后端本地 `bootRun`**
- **前端本地 `pnpm dev`**

这样修改 prompt、Skill 和前端页面时迭代最快。

### 1. 克隆仓库

```bash
git clone https://github.com/SUNNYsyy2005/interview-guide.git
cd interview-guide
git checkout baoyan-mvp
```

### 2. 配置环境变量

```bash
cp .env.example .env
```

当前本项目至少需要配置 MiniMax：

```env
PROVIDER_MINIMAX_API_KEY=your_minimax_api_key
PROVIDER_MINIMAX_BASE_URL=https://api.minimax.chat/v1
PROVIDER_MINIMAX_MODEL=MiniMax-M2.7
AI_MODEL=MiniMax-M2.7
```

如果本地开发需要让 `127.0.0.1:5173` 访问后端，建议同时设置：

```env
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://localhost:80
```

### 3. 仅启动依赖服务

```bash
docker compose up -d postgres redis minio createbuckets
```

### 4. 启动后端

```bash
./gradlew :app:bootRun
```

后端地址：

```text
http://localhost:8080
```

Swagger：

```text
http://localhost:8080/swagger-ui.html
```

### 5. 启动前端

```bash
cd frontend
corepack enable
pnpm install
pnpm dev
```

前端地址：

```text
http://127.0.0.1:5173
```

---

## Docker 部署

当前仓库仍保留完整 Docker Compose 部署方式，适合演示和服务器运行。

### 1. 配置 `.env`

```bash
cp .env.example .env
```

推荐填写：

```env
PROVIDER_MINIMAX_API_KEY=your_minimax_api_key
PROVIDER_MINIMAX_BASE_URL=https://api.minimax.chat/v1
PROVIDER_MINIMAX_MODEL=MiniMax-M2.7
AI_MODEL=MiniMax-M2.7
POSTGRES_PASSWORD=password
APP_INTERVIEW_FOLLOW_UP_COUNT=3
APP_INTERVIEW_EVALUATION_BATCH_SIZE=8
```

### 2. 启动

```bash
docker compose up -d --build
```

### 3. 访问

- 前端：`http://localhost`
- 后端：`http://localhost:8080`
- Swagger：`http://localhost:8080/swagger-ui.html`
- MinIO 控制台：`http://localhost:9001`

---

## 当前推荐测试闭环

建议优先测试以下链路：

1. 上传简历 / 项目材料
2. 进入保研诊断型面试
3. 围绕高风险表述进行连续追问
4. 输出诊断报告
5. 查看学习任务与复测重点
6. 基于报告进入下一轮训练

---

## 当前已知注意事项

### 1. 语音能力仍保留在代码中

当前产品主流程不依赖语音，但语音相关配置和模块仍在底层保留。某些本地开发环境中，如未正确配置 DashScope 语音能力，可能影响启动行为或日志表现。

### 2. 运行时 Provider 配置会持久化

默认会写入：

- `~/.interview-guide/llm-providers.yml`
- `~/.interview-guide/llm-providers.env`

如果你改了源码里的 provider 默认值，但本地仍然表现异常，记得同时检查运行时持久化配置或数据库中的 provider 配置记录。

### 3. MinIO bucket 必须存在

本地开发如果简历能上传但存储失败，优先检查 bucket `interview-guide` 是否创建成功。

### 4. 当前仍是 MVP

当前版本已经具备演示价值，但不是完整商业化产品。重点是：

- 跑通保研诊断闭环
- 提供真实有用的学习建议
- 支撑快速迭代 prompt / Skill / 报告展示

---

## 后续迭代方向

如果继续迭代，优先级建议如下：

### P0
- 实时追问：主问题预生成，追问按回答实时生成
- 更稳定的诊断报告结构
- 复测入口与复测上下文传递

### P1
- 学习任务追踪
- 科研术语卡片展示
- 两轮回答对比
- 结构化学习计划卡片

### P2
- 目标实验室 / 导师方向输入
- 更细粒度的诊断维度评分
- 更精细的保研方向 Skill 细分

---

## 致谢

本项目基于 `Snailclimb/interview-guide` 二次开发，原项目提供了：

- 简历分析底座
- 模拟面试底座
- 多模型配置能力
- 语音与知识库等扩展模块

当前版本在此基础上，将产品重点收敛到：

> **保研预推免 AI 面试诊断与学习规划 Agent**

---

## 许可证

AGPL-3.0 License
