你是一个资深 TypeScript / Node.js 工程师、AI Agent 架构师和 CLI 工具设计专家。

请从零开始帮我实现一个类似 Claude Code 的「AI Agent CLI」项目。它不是简单聊天机器人，而是一个能在终端中理解当前代码仓库、读取文件、搜索代码、制定修改计划、执行安全命令、生成补丁、让用户确认后修改项目文件的编程 Agent。

项目目标是做一个可运行、可维护、可扩展的 AI 编程助手 CLI。请优先实现稳定的最小可用版本，然后逐步扩展能力。不要一次性堆出无法运行的大量代码。每完成一个阶段，都要保证项目可以 build、可以运行，并告诉我如何验证。

==================================================
一、项目定位
==================================================

我要做的工具暂名为：

my-agent

目标体验类似：

my-agent
my-agent chat
my-agent ask "帮我解释这个项目"
my-agent run "帮我给这个项目加一个登录页面"
my-agent edit "把 README 改得更专业"
my-agent review
my-agent init
my-agent config

它应该具备类似 Claude Code 的基础体验：

1. 在终端里和用户对话。
2. 自动理解当前项目目录。
3. 能查看文件、搜索文件、读取代码。
4. 能运行安全的 shell 命令。
5. 能给出修改计划。
6. 能生成文件修改 diff。
7. 在真正写文件或执行危险操作前请求确认。
8. 能持续记住当前任务上下文。
9. 能维护 todo list，展示当前任务进度。
10. 能在一次复杂任务中多轮调用工具完成目标。
11. 修改代码后能运行测试或构建命令验证结果。
12. 所有能力都必须有安全边界。

注意：不要做 Claude Code 的复制品，不要使用 Claude Code 的名称、协议或内部实现。只做一个类似体验的开源 AI Agent CLI。

==================================================
二、技术栈要求
==================================================

使用：

- TypeScript
- Node.js 20+
- pnpm
- Commander.js：实现 CLI 命令
- Ink 或普通 readline：实现交互式终端界面，初期可以先用 readline，后续预留 Ink
- dotenv：读取环境变量
- zod：配置校验、工具参数校验
- chalk：终端颜色
- ora：loading 状态
- boxen：欢迎信息和提示框
- fast-glob：文件搜索
- ignore：解析 .gitignore
- diff：生成文本 diff
- execa：执行 shell 命令
- vitest：测试
- eslint + prettier：代码规范

请使用严格 TypeScript，尽量避免 any。

==================================================
三、模型 Provider 设计
==================================================

请不要把模型厂商写死。

设计统一接口：

LLMProvider

需要支持：

- chat(messages, options)
- streamChat(messages, options)
- tool calling 的抽象预留
- 最大上下文限制配置
- 温度、模型名、baseURL 等配置

先实现：

1. OpenAI-compatible Provider

通过环境变量配置：

OPENAI_API_KEY
OPENAI_BASE_URL
OPENAI_MODEL

要求兼容 OpenAI、DeepSeek、Moonshot、Qwen OpenAI-compatible API、本地兼容服务等。

2. Anthropic Provider 预留接口

可以先只写类型和 TODO，不必完全实现。

配置文件中需要支持：

MY_AGENT_PROVIDER=openai-compatible
MY_AGENT_MODEL=...
MY_AGENT_BASE_URL=...
MY_AGENT_API_KEY=...

不要在日志、报错、config 命令中泄露完整 API Key。显示时只显示前 4 位和后 4 位。

==================================================
四、推荐项目结构
==================================================

请创建类似下面的结构，可以合理微调，但必须保持分层清晰：

src/
  cli/
    index.ts
    commands/
      ask.ts
      chat.ts
      run.ts
      edit.ts
      review.ts
      init.ts
      config.ts
  core/
    agent.ts
    agent-loop.ts
    planner.ts
    todo.ts
    context.ts
    session.ts
    memory.ts
    config.ts
    permissions.ts
    checkpoint.ts
  llm/
    provider.ts
    openai-compatible.ts
    anthropic.ts
    messages.ts
    types.ts
  tools/
    tool.ts
    registry.ts
    result.ts
    read-file.ts
    write-file.ts
    edit-file.ts
    list-files.ts
    search-files.ts
    grep.ts
    shell.ts
    get-project-info.ts
  workspace/
    paths.ts
    git.ts
    scanner.ts
    ignore.ts
    diff.ts
    patch.ts
  ui/
    logger.ts
    prompts.ts
    spinner.ts
    format.ts
    confirm.ts
  prompts/
    system.ts
    coding-agent.ts
    review-agent.ts
  utils/
    errors.ts
    json.ts
    text.ts
    security.ts
tests/
  tools/
  core/
package.json
tsconfig.json
README.md
.env.example
.gitignore

==================================================
五、CLI 命令设计
==================================================

实现以下命令。

--------------------------------------------------
1. my-agent init
--------------------------------------------------

作用：

- 创建 .env.example
- 创建 .my-agent/ 目录
- 创建默认配置文件 .my-agent/config.json
- 创建 sessions 目录
- 创建 checkpoints 目录

示例：

my-agent init

输出：

已初始化 my-agent
请复制 .env.example 为 .env 并填写 API Key

--------------------------------------------------
2. my-agent config
--------------------------------------------------

作用：

- 显示当前 provider
- 显示模型名
- 显示 baseURL
- 显示 API Key 是否存在
- API Key 必须脱敏

示例输出：

Provider: openai-compatible
Model: deepseek-chat
Base URL: https://api.deepseek.com
API Key: sk-1a2b****9z8y

--------------------------------------------------
3. my-agent ask "问题"
--------------------------------------------------

单轮问答。

要求：

- 不进入复杂 agent loop
- 可以读取基础项目摘要
- 不自动修改文件
- 适合问简单问题

示例：

my-agent ask "这个项目是做什么的？"

--------------------------------------------------
4. my-agent chat
--------------------------------------------------

进入交互式聊天模式。

支持：

- exit / quit 退出
- /help 查看命令
- /clear 清空当前会话
- /model 查看当前模型
- /context 查看当前上下文摘要
- /tools 查看可用工具
- /session 查看当前会话信息

--------------------------------------------------
5. my-agent run "任务"
--------------------------------------------------

这是核心命令，类似 Claude Code 的任务模式。

示例：

my-agent run "帮我给这个项目加一个用户登录功能"
my-agent run "阅读代码并找出启动失败的原因"
my-agent run "把这个项目的 README 写完整"
my-agent run "修复 pnpm test 失败的问题"

行为要求：

1. 先分析项目。
2. 制定计划。
3. 展示 todo list。
4. 根据任务自动调用工具。
5. 需要修改文件时，先生成 diff。
6. 用户确认后才写入文件。
7. 修改后尝试运行相关测试或构建命令。
8. 给出最终总结。

--------------------------------------------------
6. my-agent edit "修改需求"
--------------------------------------------------

专门用于代码/文档修改。

与 run 类似，但更偏向文件编辑。

要求：

- 必须先展示将修改哪些文件。
- 必须生成 diff。
- 默认需要确认才能写入。
- 支持 --yes 参数跳过确认，但危险操作仍需拦截。

示例：

my-agent edit "把 README 改成更适合开源项目的格式"

--------------------------------------------------
7. my-agent review
--------------------------------------------------

代码审查模式。

要求：

- 读取 git diff
- 分析改动
- 输出潜在 bug、风格问题、安全问题、测试建议
- 不直接修改文件

示例：

my-agent review
my-agent review --staged

==================================================
六、Agent 核心行为
==================================================

实现一个 Agent 类，以及一个 AgentLoop。

Agent 负责：

- 维护系统提示词
- 维护当前任务
- 维护上下文
- 维护 session
- 调用 LLM
- 调用工具
- 管理权限
- 生成输出

AgentLoop 负责：

1. 接收用户任务。
2. 构建初始上下文。
3. 让模型决定下一步。
4. 调用工具。
5. 把工具结果反馈给模型。
6. 重复直到任务完成或达到最大步数。
7. 输出最终总结。

需要设置最大循环步数，例如 20 步，避免无限循环。

==================================================
七、工具系统设计
==================================================

请设计可扩展 Tool System。

每个工具包含：

- name
- description
- inputSchema: zod schema
- riskLevel: "safe" | "write" | "command" | "dangerous"
- execute(input, context): Promise<ToolResult>

ToolResult 包含：

- ok: boolean
- content: string
- data?: unknown
- error?: string

工具注册表：

ToolRegistry

支持：

- register(tool)
- get(name)
- list()
- execute(name, input, context)

工具上下文 ToolContext 包含：

- cwd
- sessionId
- permissionManager
- logger

==================================================
八、第一批工具
==================================================

请实现以下工具。

--------------------------------------------------
1. get_project_info
--------------------------------------------------

作用：

- 获取当前项目基本信息

需要读取：

- 当前目录名
- package.json
- tsconfig.json
- README
- git 分支
- git 状态
- 常见框架判断

输出项目摘要。

--------------------------------------------------
2. list_files
--------------------------------------------------

作用：

列出项目文件。

要求：

- 默认忽略：
  - node_modules
  - .git
  - dist
  - build
  - coverage
  - .next
  - .turbo
  - .cache
- 遵守 .gitignore
- 输出相对路径
- 支持 maxResults
- 支持目录参数

--------------------------------------------------
3. read_file
--------------------------------------------------

作用：

读取文件。

要求：

- 只能读取当前工作目录及子目录
- 防止路径穿越
- 默认最大读取 200KB
- 大文件需要截断并提示
- 二进制文件不读取
- 输出带行号的文本，方便模型引用

--------------------------------------------------
4. search_files
--------------------------------------------------

作用：

根据文件名搜索。

示例：

search_files({ pattern: "agent" })

要求：

- 支持 glob
- 遵守忽略规则
- 返回相对路径

--------------------------------------------------
5. grep
--------------------------------------------------

作用：

在项目中搜索文本。

要求：

- 支持 query
- 支持 include glob
- 支持 exclude glob
- 默认忽略 node_modules、.git 等
- 返回文件路径、行号、匹配行
- 限制最大结果数量

--------------------------------------------------
6. write_file
--------------------------------------------------

作用：

写入新文件或覆盖文件。

要求：

- 只能写当前项目内文件
- 写入前创建 checkpoint 或备份
- 默认需要用户确认
- 输出写入结果
- 不允许写入 .env、密钥文件，除非用户明确确认

--------------------------------------------------
7. edit_file
--------------------------------------------------

作用：

对已有文件做编辑。

实现方式可以先简单一点：

- 输入 path
- 输入 oldText
- 输入 newText
- 找到 oldText 后替换
- 替换前生成 diff
- 用户确认后写入

要求：

- oldText 必须唯一匹配，否则报错
- 不能静默修改多个位置
- 写入前创建 checkpoint
- 输出 diff

后续预留更强 patch apply 能力。

--------------------------------------------------
8. shell
--------------------------------------------------

作用：

执行 shell 命令。

要求：

- 使用 execa
- 默认 cwd 为当前项目
- 设置 timeout，例如 30 秒
- 返回 stdout、stderr、exitCode
- 默认安全模式

必须拦截危险命令，例如：

- rm -rf /
- rm -rf *
- del /s
- rd /s
- format
- mkfs
- dd if=
- sudo rm
- chmod -R 777 /
- chown -R
- powershell 删除大量文件
- 修改系统目录
- 删除 .git
- 删除当前项目根目录

对于中等风险命令，必须确认：

- rm
- del
- mv 大范围
- git reset --hard
- git clean -fd
- npm publish
- pnpm publish
- git push --force
- curl | sh
- wget | sh

普通安全命令可直接执行，例如：

- git status
- git diff
- pnpm test
- pnpm build
- npm test
- ls
- dir
- cat package.json

==================================================
九、权限系统
==================================================

实现 PermissionManager。

权限等级：

1. read：读取文件、列目录、搜索
2. write：写文件、编辑文件
3. command：执行普通命令
4. dangerous：危险命令，默认不允许

默认策略：

- read 自动允许
- write 需要确认
- command 根据命令风险判断
- dangerous 默认拒绝

支持 CLI 参数：

--yes

表示自动确认普通写入和低风险命令，但危险操作仍然拒绝。

支持配置：

.my-agent/config.json

例如：

{
  "permissions": {
    "allowRead": true,
    "confirmBeforeWrite": true,
    "confirmBeforeCommand": false,
    "denyDangerousCommands": true
  }
}

==================================================
十、Diff 与 Checkpoint
==================================================

实现两个关键能力。

--------------------------------------------------
1. Diff
--------------------------------------------------

修改文件前必须展示 diff。

要求：

- 展示旧内容和新内容差异
- 用颜色区分增加和删除
- 大 diff 要截断显示，并提示完整 diff 文件路径
- 用户确认后才写入

--------------------------------------------------
2. Checkpoint
--------------------------------------------------

每次写文件前，在：

.my-agent/checkpoints/

保存修改前文件副本。

checkpoint 信息包含：

- 时间
- 原文件路径
- 备份文件路径
- 任务 ID
- 修改原因

未来预留 rollback 命令，但第一版可以只保存，不实现回滚。

==================================================
十一、上下文系统
==================================================

实现 ContextManager。

需要收集：

- 当前 cwd
- 项目基本信息
- package.json 摘要
- git status
- 当前任务
- 最近会话历史
- 已读取的重要文件
- todo list
- 工具执行结果摘要

要求：

- 不要把整个项目塞给模型
- 按需读取文件
- 对过长内容做截断
- 保留重要摘要

实现简单 token 估算即可，例如按字符数粗略估算。

==================================================
十二、Session 系统
==================================================

会话保存在：

.my-agent/sessions/

每个 session 是 JSON 文件。

记录：

- sessionId
- createdAt
- updatedAt
- cwd
- messages
- task
- toolCalls
- todos

支持：

- 创建新 session
- 读取最近 session
- 追加消息
- 清空 session
- 保存工具调用记录

==================================================
十三、Todo 系统
==================================================

实现 TodoManager。

Todo 状态：

- pending
- in_progress
- completed
- cancelled

Agent 在复杂任务中应该维护 todo。

示例显示：

任务计划：
[ ] 阅读项目结构
[ ] 找到入口文件
[ ] 修改 README
[ ] 运行测试
[ ] 总结结果

执行过程中更新：

[✓] 阅读项目结构
[→] 修改 README
[ ] 运行测试

==================================================
十四、Agent 的系统提示词
==================================================

请在 src/prompts/coding-agent.ts 中写一个强系统提示词，要求 Agent 遵守：

1. 你是一个终端中的 AI 编程 Agent。
2. 你可以通过工具读取文件、搜索代码、运行命令、修改文件。
3. 不要凭空猜测项目内容，必须优先读取真实文件。
4. 修改前必须先理解相关代码。
5. 对复杂任务先制定计划。
6. 修改文件前必须生成 diff。
7. 写入文件或执行高风险命令前必须请求确认。
8. 不要泄露 API Key、token、密码等敏感信息。
9. 不要读取当前项目外的文件。
10. 不要执行危险命令。
11. 任务完成后，总结修改内容、验证方式、后续建议。
12. 工具调用失败时要解释原因并尝试替代方案。
13. 保持输出简洁、有条理。

==================================================
十五、模型工具调用实现策略
==================================================

第一版可以不依赖真实 function calling。

可以采用 JSON Action 协议，让模型输出结构化动作。

例如模型每一步只能输出以下 JSON 之一：

{
  "type": "thought",
  "content": "我需要先查看项目结构"
}

{
  "type": "tool",
  "toolName": "list_files",
  "input": {
    "path": ".",
    "maxResults": 100
  }
}

{
  "type": "plan",
  "todos": [
    "阅读 package.json",
    "找到入口文件",
    "修改 README",
    "运行测试"
  ]
}

{
  "type": "final",
  "content": "任务完成总结"
}

AgentLoop 解析 JSON，根据 type 决定下一步。

要求：

- 对模型输出做 JSON 解析和 zod 校验
- 解析失败时，让模型重新输出合法 JSON
- 达到最大循环次数时停止
- 所有工具调用结果都追加进 messages

未来再替换成真正的 function calling。

==================================================
十六、交互式确认
==================================================

实现 confirm 工具函数。

当需要写文件时，显示：

即将修改文件：src/example.ts

Diff:
...

是否应用修改？[y/N]

当需要执行中风险命令时，显示：

即将执行命令：
git reset --hard

该命令可能丢失本地修改。是否继续？[y/N]

默认 N。

在非交互模式下：

- 没有 --yes 则拒绝写入
- 有 --yes 则允许低风险写入
- dangerous 永远拒绝

==================================================
十七、Git 集成
==================================================

实现 workspace/git.ts。

功能：

- 检查是否在 git 仓库中
- 获取当前分支
- 获取 git status --short
- 获取 git diff
- 获取 git diff --staged

review 命令使用它。

Agent 在修改前可以提示当前工作区是否有未提交变更。

不要自动 commit。
不要自动 push。
不要自动 rebase。
除非用户明确要求。

==================================================
十八、Review 模式
==================================================

my-agent review 行为：

1. 读取 git diff。
2. 如果没有 diff，提示没有可审查改动。
3. 把 diff 发送给模型。
4. 输出审查报告。

报告格式：

# Code Review

## 高风险问题

## 潜在 Bug

## 可维护性建议

## 测试建议

## 总结

review 模式不修改文件。

==================================================
十九、安全细节
==================================================

必须实现路径安全函数：

safeResolve(cwd, userPath)

要求：

- path.resolve
- 确认结果仍在 cwd 内
- Windows 路径兼容
- 阻止 ../ 路径逃逸
- 阻止访问用户主目录、系统目录

敏感文件保护：

默认不允许读取或写入：

- .env
- .env.local
- .env.production
- id_rsa
- id_ed25519
- *.pem
- *.key
- secrets.*
- credentials.*

除非用户明确要求，并且只允许摘要，不允许完整输出密钥内容。

==================================================
二十、终端 UI 体验
==================================================

请让 CLI 输出清晰舒服。

要求：

- 欢迎信息
- 当前模型显示
- 当前项目目录显示
- loading spinner
- 工具调用时显示简短状态

示例：

> 正在分析项目结构...
> 读取 package.json
> 搜索 src/**/*.ts
> 生成修改计划
> 等待确认写入 README.md

工具结果不要刷屏太多。长内容要折叠或摘要。

==================================================
二十一、README 要求
==================================================

README 至少包含：

1. 项目介绍
2. 功能特性
3. 安装方法
4. 环境变量配置
5. CLI 命令说明
6. 使用示例
7. Agent 工作原理
8. 工具系统说明
9. 安全策略
10. 项目结构
11. 开发计划

示例命令：

pnpm install
cp .env.example .env
pnpm dev -- ask "你好"
pnpm dev -- chat
pnpm dev -- run "帮我解释这个项目"
pnpm dev -- review

==================================================
二十二、package.json 脚本
==================================================

请保证有这些脚本：

{
  "scripts": {
    "dev": "tsx src/cli/index.ts",
    "build": "tsc",
    "start": "node dist/cli/index.js",
    "test": "vitest",
    "lint": "eslint .",
    "format": "prettier --write ."
  }
}

CLI bin 配置：

{
  "bin": {
    "my-agent": "dist/cli/index.js"
  }
}

构建后 dist/cli/index.js 顶部需要有 shebang：

#!/usr/bin/env node

==================================================
二十三、测试要求
==================================================

写基础测试：

1. safeResolve 防止路径穿越
2. read_file 不能读取项目外文件
3. list_files 忽略 node_modules
4. grep 能找到匹配内容
5. shell 拦截危险命令
6. edit_file oldText 不唯一时报错
7. config 能正确脱敏 API Key

测试不需要覆盖所有功能，但核心安全逻辑必须测试。

==================================================
二十四、开发顺序
==================================================

请严格按阶段实现，不要跳步。

阶段 1：初始化项目
- package.json
- tsconfig.json
- eslint
- prettier
- vitest
- 基础目录结构

阶段 2：配置系统
- .env.example
- config.ts
- zod 校验
- API Key 脱敏

阶段 3：CLI 基础命令
- init
- config
- ask 占位
- chat 占位

阶段 4：LLM Provider
- Provider 接口
- OpenAI-compatible 实现
- ask 命令可真实调用模型

阶段 5：Session
- 本地 session JSON
- chat 命令支持多轮对话
- /help /clear /exit

阶段 6：工具系统
- Tool 接口
- ToolRegistry
- ToolResult
- ToolContext

阶段 7：基础读工具
- get_project_info
- list_files
- read_file
- search_files
- grep

阶段 8：安全系统
- safeResolve
- sensitive file guard
- PermissionManager
- shell command risk classifier

阶段 9：写工具
- write_file
- edit_file
- diff
- checkpoint
- confirm

阶段 10：shell 工具
- 安全执行命令
- 超时
- stdout/stderr 捕获

阶段 11：AgentLoop
- JSON Action 协议
- 工具调用循环
- 最大步数限制
- 失败重试

阶段 12：run/edit/review 命令
- run 任务模式
- edit 修改模式
- review git diff 审查

阶段 13：README 和测试完善

每个阶段完成后，请运行：

pnpm build
pnpm test

并修复错误。

==================================================
二十五、最终验收标准
==================================================

完成后，我应该可以这样使用：

pnpm install
cp .env.example .env

然后填写 API Key。

之后执行：

pnpm dev -- init
pnpm dev -- config
pnpm dev -- ask "你好，介绍一下你自己"
pnpm dev -- chat
pnpm dev -- run "帮我解释这个项目结构"
pnpm dev -- edit "帮我优化 README"
pnpm dev -- review

期望结果：

1. ask 可以得到模型回复。
2. chat 可以多轮对话。
3. run 可以读取项目文件并给出分析。
4. edit 会生成 diff，并在确认后修改文件。
5. review 可以读取 git diff 并输出审查意见。
6. 工具不能访问项目目录外的文件。
7. 危险 shell 命令会被拦截。
8. 写入文件前会创建 checkpoint。
9. API Key 不会被泄露。
10. pnpm build 和 pnpm test 通过。

==================================================
二十六、实现要求
==================================================

请现在开始创建项目。

重要要求：

- 不要只给我解释，请直接创建代码文件。
- 不要一次性写无法运行的大项目。
- 每一步都保证可以运行。
- 遇到设计取舍时，选择更安全、更清晰的实现。
- 代码注释适量，不要过度注释。
- 错误提示要适合普通开发者阅读。
- Windows、macOS、Linux 都要尽量兼容，尤其注意 Windows 路径和 shell 命令差异。