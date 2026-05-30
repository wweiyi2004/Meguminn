# Meguminn

AI Agent CLI - 一个终端中的 AI 编程助手。类似 Claude Code 的体验，支持多种 LLM 提供商。

## 功能特性

- 终端交互式对话
- 自动理解项目结构
- 文件读取、搜索、编辑
- 安全执行 shell 命令
- 修改前生成 diff 预览
- 写入前创建 checkpoint 备份
- 权限系统保护安全操作
- 任务计划与进度追踪
- 代码审查 (git diff review)
- 会话持久化

## 安装

```bash
pnpm install
cp .env.example .env
# 编辑 .env 填写你的 API Key
```

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `MEGUMINN_PROVIDER` | LLM 提供商 | `openai-compatible` |
| `MEGUMINN_MODEL` | 模型名称 | `gpt-4o-mini` |
| `MEGUMINN_BASE_URL` | API 地址 | `https://api.openai.com/v1` |
| `MEGUMINN_API_KEY` | API Key | (必填) |

兼容 OpenAI、DeepSeek、Moonshot、Qwen 等 OpenAI-compatible API。

## CLI 命令

### `meguminn init`
初始化项目，创建 `.meguminn/` 目录和配置文件。

### `meguminn config`
显示当前配置（API Key 自动脱敏）。

### `meguminn ask "问题"`
单轮问答，不进入 Agent 循环。

### `meguminn chat`
进入交互式多轮对话模式。支持 `/help`、`/clear`、`/model`、`/session` 命令。

### `meguminn run "任务"`
核心命令。Agent 会分析项目、制定计划、调用工具、修改文件。

```bash
meguminn run "帮我解释这个项目"
meguminn run "修复测试失败" --yes
```

### `meguminn edit "修改需求"`
专注于文件编辑。会生成 diff 并要求确认。

```bash
meguminn edit "优化 README 格式"
```

### `meguminn review`
代码审查模式。读取 git diff 并输出审查报告。

```bash
meguminn review
meguminn review --staged
```

## 使用示例

```bash
pnpm install
cp .env.example .env
# 填写 API Key

pnpm dev -- init
pnpm dev -- config
pnpm dev -- ask "你好"
pnpm dev -- chat
pnpm dev -- run "帮我解释这个项目结构"
pnpm dev -- edit "帮我优化 README"
pnpm dev -- review
```

## Agent 工作原理

1. 接收用户任务
2. 构建系统提示词和上下文
3. 调用 LLM 决定下一步动作
4. 解析 JSON Action 协议（thought / tool / plan / final）
5. 执行工具调用并将结果反馈给 LLM
6. 重复直到任务完成或达到最大步数（默认 20 步）

## 工具系统

| 工具 | 说明 | 风险等级 |
|------|------|----------|
| `get_project_info` | 获取项目信息 | safe |
| `list_files` | 列出文件 | safe |
| `read_file` | 读取文件 | safe |
| `search_files` | 按文件名搜索 | safe |
| `grep` | 文本内容搜索 | safe |
| `write_file` | 写入文件 | write |
| `edit_file` | 编辑文件 | write |
| `shell` | 执行命令 | command |

## 安全策略

- **路径安全**：所有文件操作限制在项目目录内，防止路径穿越
- **敏感文件保护**：默认阻止访问 `.env`、密钥文件等
- **命令风险分级**：safe / medium / dangerous 三级分类
- **危险命令拦截**：`rm -rf /`、`format` 等直接拒绝
- **中风险命令确认**：`rm`、`git reset --hard` 等需要用户确认
- **Checkpoint 备份**：写入文件前自动备份
- **API Key 脱敏**：配置显示时自动隐藏

## 项目结构

```
src/
  cli/          # CLI 命令
  core/         # Agent 核心逻辑
  llm/          # LLM Provider
  tools/        # 工具实现
  workspace/    # 工作区工具（git, diff, ignore）
  ui/           # 终端 UI
  prompts/      # 系统提示词
  utils/        # 工具函数
tests/          # 测试
```

## 开发

```bash
pnpm build     # 编译 TypeScript
pnpm dev       # 开发模式运行
pnpm test      # 运行测试
pnpm lint      # 代码检查
```

## 开发计划

- [ ] Ink 交互式 UI
- [ ] 真正的 function calling 支持
- [ ] Anthropic Provider 完整实现
- [ ] Checkpoint rollback 命令
- [ ] 更多工具（patch apply, AST 分析等）
- [ ] 插件系统

## License

MIT
