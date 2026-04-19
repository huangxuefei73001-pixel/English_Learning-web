# English_Learning

一个移动优先的英语学习 Web App，基于 Next.js 14 + TypeScript + Tailwind CSS 搭建。现在首页已经接入真实模型接口，输入英文单词后会生成结构化的中英释义、近义词区别、常见搭配、例句和记忆方法。

## 已包含页面

- 首页 Dashboard
- Chat 对话页
- Word Detail 词条详情页
- Compare 易混词对比页
- My Library 资料库页
- Dictionary 词典入口页

## 视觉方向

- 主色：`#2F6B57`
- 深色：`#1F4D3A`
- 柔和绿：`#DDECE4`
- 背景：`#F7FAF8`
- 正文：`#1D2A24`

## 技术栈

- Next.js 14 App Router
- TypeScript
- Tailwind CSS
- OpenRouter Chat Completions API
- 默认模型：`openrouter/auto`

## 运行

1. 安装依赖
2. 启动开发服务

```bash
npm install
npm run build
npm run dev
```

## OpenRouter 配置

在项目根目录创建 `.env.local`，至少配置：

```bash
OPENROUTER_API_KEY=your_key_here
OPENROUTER_MODEL=openrouter/auto
OPENROUTER_API_URL=https://openrouter.ai/api/v1/chat/completions
```

如果你想给 OpenRouter 带上站点信息，也可以补上：

```bash
OPENROUTER_HTTP_REFERER=https://your-site.example
OPENROUTER_TITLE=English_Learning
```

代码会自动把 `OPENROUTER_BASE_URL` 或 `OPENAI_BASE_URL` 归一成 `/chat/completions` 端点。

如果没有配置 API key，网站会回退到本地 demo 数据，但路由和页面结构保持一致。

如果你在腾讯云服务器上部署，优先把 key 放到服务器的 `.env.local` 或进程环境变量里，不要写进前端代码，也不要提交到仓库。`OPENROUTER_API_URL` 只有在服务器需要改成别的 OpenRouter-compatible 入口时才改。

## 腾讯云部署

详细的线上部署步骤放在 `DEPLOY_TENCENT.md`。

仓库里同时准备了：

- `systemd/English_Learning.service`
- `nginx/English_Learning.conf`
- `nginx/English_Learning-test.conf`

如果你要最快上线，就照着 `DEPLOY_TENCENT.md` 逐步执行。

## 路由

- `/` - 首页
- `/chat` - AI 对话
- `/dictionary` - 词典入口
- `/word/[slug]` - 词条详情
- `/compare` - 易混词对比
- `/library` - 我的资料库

## 说明

- 首页通过 `/api/translate` 调用 OpenRouter Chat Completions API；没有 API key 时会自动回退到本地 demo。
- 现有的 `index.html`、`app.js`、`styles.css` 属于旧版静态原型，可以暂时保留，不影响新的 App Router 骨架。
