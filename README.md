# Word Islands

Word Islands 是一个面向真实用户的英语学习站，不是普通翻译页。首页先快速展示基础词卡，再异步生成完整 Study Card，让用户既能立刻看到释义，也能继续得到近义词区别、搭配、例句、记忆方法和写作提示。

当前线上站点：

- [https://wordislands.cn](https://wordislands.cn)

当前产品规则：

- 游客可以直接查词
- 登录后才能收藏单词并进入复习队列
- 每个账号只看到自己的收藏和复习记录
- 旧收藏 JSON 导入只对 admin 账号开放

## 当前架构

- Next.js 14 App Router
- TypeScript
- Tailwind CSS
- DeepSeek 官方 Chat Completions API
- 默认模型：`deepseek-v4-flash`
- 账号与收藏存储：`.data/word-islands.json`
- Study Card 缓存：`.word-islands-cache/study-cards.json`

详细架构说明见：

- [docs/architecture.md](./docs/architecture.md)
- [DEPLOY_TENCENT.md](./DEPLOY_TENCENT.md)
- [DEPLOY_QUICK.md](./DEPLOY_QUICK.md)

## 首页和 Study Card 行为

查词分成两阶段：

1. `basic`：快速返回基础卡片
   - `word`
   - `phonetics`
   - `partOfSpeech`
   - `chineseMeaning`
   - `englishDefinition`
   - `basic collocations`
2. `study`：生成完整 Study Card
   - 近义词区别
   - 记忆方法
   - 使用场景
   - 真实例句
   - 易错点
   - 写作 / 汇报用法

Study Card 结果会写入服务端缓存。当前缓存版本前缀是 `deepseek-v1`，这样旧的 OpenRouter 缓存不会再污染现在的结果。

## 环境变量

在项目根目录创建 `.env.local`：

```bash
DEEPSEEK_API_KEY=your_key_here
DEEPSEEK_API_URL=https://api.deepseek.com/chat/completions
DEEPSEEK_MODEL=deepseek-v4-flash
WORD_ISLANDS_ADMIN_EMAILS=huang_xuefei@yeah.net
```

可选变量：

```bash
WORD_ISLANDS_DB_PATH=.data/word-islands.json
```

说明：

- `DEEPSEEK_API_KEY` 必填
- `DEEPSEEK_API_URL` 默认就是官方 `chat/completions`
- `DEEPSEEK_MODEL` 当前固定使用 `deepseek-v4-flash`
- `WORD_ISLANDS_ADMIN_EMAILS` 用英文逗号分隔多个 admin 邮箱
- `WORD_ISLANDS_DB_PATH` 不填时默认写入项目根目录 `.data/word-islands.json`

## 本地运行

```bash
npm install
npm run build
npm run dev
```

推荐的本地验证顺序：

```bash
npm run build
npm run typecheck
```

## 主要路由

页面路由：

- `/` - 首页
- `/chat` - AI 对话页
- `/dictionary` - 词典入口
- `/word/[slug]` - 词条详情
- `/compare` - 易混词对比
- `/library` - 资料库

账号与收藏：

- `/api/auth/register` - 注册
- `/api/auth/login` - 登录
- `/api/auth/logout` - 退出登录
- `/api/auth/me` - 当前登录用户
- `/api/favorites` - 当前用户收藏列表与新增收藏
- `/api/favorites/[slug]` - 删除当前用户收藏
- `/api/favorites/import` - admin 导入旧收藏 JSON

查词接口：

- `/api/translate`
  - `mode: "basic"` 返回基础卡片
  - `mode: "study"` 返回完整 Study Card

## 腾讯云部署

腾讯云部署、systemd、Nginx、HTTPS 与排障流程见：

- [DEPLOY_TENCENT.md](./DEPLOY_TENCENT.md)
- [DEPLOY_QUICK.md](./DEPLOY_QUICK.md)

仓库内已经准备好：

- `systemd/English_Learning.service`
- `nginx/English_Learning.conf`
- `nginx/English_Learning-test.conf`

## 数据文件

服务端用户数据：

```bash
.data/word-islands.json
```

Study Card 缓存：

```bash
.word-islands-cache/study-cards.json
```

这两个目录都不应提交线上真实数据。

## 历史文件说明

以下文件属于早期静态原型，可保留但不是当前线上主入口：

- `index.html`
- `app.js`
- `styles.css`
