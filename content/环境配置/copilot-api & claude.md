---
title: "claude接入copilot"
date: 2026-03-21T00:38:31+08:00
categories: ["环境配置"]
tags: []
series: []
---

# claude接入copilot-api

## 安装

**copilot-api**

`npm install -g copilot-api`

启动：`copilot-api start`

**claude**

[Quickstart - Claude Code Docs](https://code.claude.com/docs/en/quickstart)

`curl -fsSL https://claude.ai/install.sh | bash`

## 配置

### claude

在 `~/.claude/settings.json`中添加以下内容

```json
{
    "env": {
        "DISABLE_NON_ESSENTIAL_MODEL_CALLS": "1",
        "ANTHROPIC_BASE_URL": "http://localhost:4141",
        "ANTHROPIC_AUTH_TOKEN": "dummy",
        "API_TIMEOUT_MS": "3000000",
        "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "1",
        "ANTHROPIC_MODEL": "claude-opus-4.6"
    }
}
```

环境变量中添加一下内容，token随便填，目的是跳过claude的账号检测

`export ANTHROPIC_AUTH_TOKEN="dummy"`

> [!tip]
>
> claude中和vscode的`#tool:vscode/askQuestions`对应的工具是`AskUserQuestion`

### copilot-api

修改`isAgentCall`判断，可以利用subagent不消耗次数的feature

```bash
# 定位代码行
grep -n "isAgentCall" $(npm root -g)/copilot-api/dist/main.js

# 强制返回true
const isAgentCall = true;
```

重启生效

## 注意

> [!warning]
>
> 注意不要滥用，免得被封禁。差不多得了