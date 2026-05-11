# Word Islands 最短部署清单

这份清单只保留日常更新最需要的步骤，适合已经有服务器、已有 Nginx 和 systemd 的情况。

完整说明见：

- [DEPLOY_TENCENT.md](./DEPLOY_TENCENT.md)

## 1. 进入项目

```bash
cd /home/ubuntu/English_Learning
```

## 2. 更新代码

先确认工作区状态：

```bash
git status --short
```

如果工作区没有要保留的本地改动，再更新：

```bash
git pull --ff-only origin main
```

## 3. 安全更新环境变量

先备份：

```bash
cp .env.local .env.local.bak.$(date +%Y%m%d-%H%M%S)
```

当前最少需要：

```bash
DEEPSEEK_API_KEY=你的key
DEEPSEEK_API_URL=https://api.deepseek.com/chat/completions
DEEPSEEK_MODEL=deepseek-v4-flash
WORD_ISLANDS_ADMIN_EMAILS=huang_xuefei@yeah.net
```

如果你也启用了 admin 统计，推荐显式保留：

```bash
WORD_ISLANDS_STATS_PATH=.data/word-islands-stats.json
```

## 4. 重建并重启

```bash
rm -rf .next
npm run build
sudo systemctl restart English_Learning
sleep 3
```

## 5. 验证接口

```bash
curl -s http://127.0.0.1:3000/api/translate -H 'Content-Type: application/json' -d '{"query":"salient","mode":"study"}'
curl -s -X POST http://127.0.0.1:3000/api/stats/track
curl -i -s http://127.0.0.1:3000/api/stats
```

成功时应看到：

```json
"source":"deepseek"
```

额外说明：

- `POST /api/stats/track` 应返回 `{"ok":true}`
- 未登录时 `GET /api/stats` 返回 `403` 是正常的，不是故障
- admin 登录后的浏览器会从 `/api/stats` 拿到 `200`

## 6. 如果结果像旧 provider

先查当前代码：

```bash
grep -n 'DEEPSEEK\|OPENROUTER\|XIAOMI' app/api/translate/route.ts
```

如果命中了旧缓存，清掉后再 build：

```bash
rm -rf .word-islands-cache
npm run build
sudo systemctl restart English_Learning
```

## 7. 验证站点

```bash
curl -I http://127.0.0.1:3000
curl -I http://127.0.0.1:8083
curl -I https://wordislands.cn
```

如果部署后浏览器出现：

- `Loading chunk ... failed`
- `Failed to load resource`
- 页面仍然像旧版本

先对账这三处，不要马上改业务代码：

```bash
find .next/static/chunks/app -name 'page-*.js'
find .next/static/css -type f
curl -s http://127.0.0.1:3000 | grep -o '/_next/static/chunks/app/page-[^"]*js'
curl -s http://127.0.0.1:3000 | grep -o '/_next/static/css/[^"]*css' | head -1
curl -s https://wordislands.cn | grep -o '/_next/static/chunks/app/page-[^"]*js'
curl -s https://wordislands.cn | grep -o '/_next/static/css/[^"]*css' | head -1
```

判断方法：

- `127.0.0.1:3000` 和 `.next` 不一致：服务没切到最新 build
- `127.0.0.1:3000` 已是新版本，但域名还是旧资源：域名入口或浏览器缓存还没切过去

如果服务器端已经是新资源，优先用无痕窗口访问：

```text
https://wordislands.cn/?v=<当前BUILD_ID>
```

## 8. 这份清单适用的前提

- `systemd/English_Learning.service` 已安装
- Nginx 已按 `nginx/English_Learning.conf` 配好
- 域名和 HTTPS 已经打通

如果不是以上前提，请回到：

- [DEPLOY_TENCENT.md](./DEPLOY_TENCENT.md)
