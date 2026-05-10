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
```

成功时应看到：

```json
"source":"deepseek"
```

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

## 8. 这份清单适用的前提

- `systemd/English_Learning.service` 已安装
- Nginx 已按 `nginx/English_Learning.conf` 配好
- 域名和 HTTPS 已经打通

如果不是以上前提，请回到：

- [DEPLOY_TENCENT.md](./DEPLOY_TENCENT.md)
