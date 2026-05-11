# 腾讯云部署说明

这份说明对应的是当前这套 Next.js 英语学习站，不是仓库里早期的静态原型。

目标很简单：

- 网站跑在腾讯云 CVM 上
- 通过 Nginx 对外提供 `8083`（或后续再切到域名和 `80/443`）
- DeepSeek Key 放在服务器环境里，不进前端代码
- 账号、收藏、复习队列数据保存在服务器 `.data/word-islands.json`
- admin 统计数据保存在服务器 `.data/word-islands-stats.json`
- Study Card 缓存保存在服务器 `.word-islands-cache/study-cards.json`

## 1. 服务器准备

推荐配置：

- 系统：Ubuntu 22.04 / 24.04
- 内存：2 GB 起步，4 GB 更稳
- Node.js：18.18+，建议 20 LTS
- 公网出站：能访问 `api.deepseek.com:443`

先在腾讯云控制台确认：

- 安全组放行 `22`、`80`、`443`
- 不要把 `3000` 暴露给公网

登录服务器后执行：

```bash
sudo apt update
sudo apt install -y git nginx curl
```

安装 Node.js 20 LTS:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v
```

## 2. 部署代码

把项目放到服务器上，例如：

```bash
cd /home/ubuntu
git clone <你的仓库地址> English_Learning
cd English_Learning
```

如果你是手动上传代码，也要保证最终目录里能看到：

- `package.json`
- `app/`
- `components/`
- `data/`
- `next.config.mjs`

## 3. 配置环境变量

在项目根目录创建 `.env.local`：

```bash
cat > .env.local <<'EOF'
DEEPSEEK_API_KEY=你的key
DEEPSEEK_API_URL=https://api.deepseek.com/chat/completions
DEEPSEEK_MODEL=deepseek-v4-flash
WORD_ISLANDS_ADMIN_EMAILS=huang_xuefei@yeah.net
EOF
```

说明：

- `DEEPSEEK_API_KEY` 是真正的密钥
- `DEEPSEEK_API_URL` 默认就是 DeepSeek 官方 `chat/completions` 端点
- `DEEPSEEK_MODEL` 当前固定使用 `deepseek-v4-flash`
- `WORD_ISLANDS_ADMIN_EMAILS` 是允许导入旧收藏 JSON 的 admin 邮箱，多个邮箱用英文逗号隔开
- 收藏和复习队列默认保存在项目根目录 `.data/word-islands.json`
- admin 统计默认写入 `.data/word-islands-stats.json`
- Study Card 缓存默认写入 `.word-islands-cache/study-cards.json`
- 如果你不想把 key 写到文件里，也可以直接在系统环境变量里导出，但 `.env.local` 最简单

如果你想固定账号数据文件位置，可以增加：

```bash
WORD_ISLANDS_DB_PATH=/home/ubuntu/English_Learning/.data/word-islands.json
```

如果你想固定 stats 文件位置，也可以增加：

```bash
WORD_ISLANDS_STATS_PATH=/home/ubuntu/English_Learning/.data/word-islands-stats.json
```

## 4. 安装依赖并构建

```bash
npm ci
npm run build
```

构建成功后，Next.js 会生成生产产物 `.next/`。

## 5. 先本机启动验证

先在前台跑一次，确认没有编译或运行错误：

```bash
npm run start
```

默认会监听 `http://127.0.0.1:3000`。

另开一个 SSH 窗口验证：

```bash
curl -I http://127.0.0.1:3000
curl -s http://127.0.0.1:3000/api/translate -H 'Content-Type: application/json' -d '{"query":"salient","mode":"study"}'
curl -s http://127.0.0.1:3000/api/auth/me
curl -s -X POST http://127.0.0.1:3000/api/stats/track
curl -i -s http://127.0.0.1:3000/api/stats
```

如果 API 返回的是 `source: "deepseek"`，说明服务器已经成功读取到 key 并打通模型请求。

Stats 这两条的正确理解是：

- `POST /api/stats/track` 返回 `{"ok":true}`
- 未登录时 `GET /api/stats` 返回 `403` 是正常的
- admin 登录后的浏览器请求 `/api/stats` 应返回 `200`

如果仍然返回旧的 `openrouter` 或 `openrouter-cache`，优先检查：

- `app/api/translate/route.ts` 是否已经是 DeepSeek 版本
- 服务是否已经重启到最新 build
- `.word-islands-cache/` 是否残留旧 provider 缓存

## 6. 用 systemd 托管进程

仓库里已经准备好了服务文件：

- `systemd/English_Learning.service`

把它安装到服务器：

```bash
sudo cp systemd/English_Learning.service /etc/systemd/system/English_Learning.service
sudo systemctl daemon-reload
sudo systemctl enable English_Learning
sudo systemctl start English_Learning
sudo systemctl status English_Learning
```

看日志：

```bash
sudo journalctl -u English_Learning -f
```

如果你改了 `.env.local` 或重新 build 过：

```bash
sudo systemctl restart English_Learning
```

## 7. 配置 Nginx 反代

仓库里已经准备了两份配置模板：

- `nginx/English_Learning.conf`
- `nginx/English_Learning-test.conf`

当前这套模板按独立站点默认跑在 `8083`，并显式绑定公网 IP，避免同机多站点时因为 `server_name _;` 或默认站点匹配不稳导致公网访问异常。

安装到 Nginx：

```bash
sudo cp nginx/English_Learning.conf /etc/nginx/sites-available/English_Learning
sudo ln -sf /etc/nginx/sites-available/English_Learning /etc/nginx/sites-enabled/English_Learning
sudo nginx -t
sudo systemctl reload nginx
```

如果你的公网 IP 不是 `81.70.165.205`，先把 `nginx/English_Learning.conf` 里的 `server_name` 改成你自己的公网 IP 或域名。

当前模板关键配置是：

- `listen 8083 default_server;`
- `listen [::]:8083 default_server;`
- `server_name 你的公网IP;`

这三项不要省略。

## 8. 域名和 HTTPS

如果你有域名，建议这样做：

1. 在 DNS 里给域名加 `A` 记录，指向腾讯云公网 IP
2. 把 Nginx 里的 `server_name` 改成你的域名
3. 申请证书

安装 Certbot：

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d learn.yourdomain.com
```

完成后访问：

```text
https://learn.yourdomain.com
```

## 9. DeepSeek 连不上的排查

这是最容易卡住的地方，按这个顺序查。

### 9.1 先确认环境变量

```bash
cat .env.local
```

至少要看到：

- `DEEPSEEK_API_KEY=...`
- `DEEPSEEK_MODEL=deepseek-v4-flash`

### 9.2 确认服务已经重启

```bash
sudo systemctl restart English_Learning
sudo journalctl -u English_Learning -n 50 --no-pager
```

### 9.3 确认服务器能出网

```bash
curl -I https://api.deepseek.com
```

如果这里都不通，问题不是代码，是腾讯云服务器的出网网络或者代理。

### 9.4 如果仍然返回旧 provider

先查代码和缓存：

```bash
grep -n 'DEEPSEEK\|OPENROUTER\|XIAOMI' app/api/translate/route.ts
rm -rf .word-islands-cache
npm run build
sudo systemctl restart English_Learning
```

### 9.5 如果首页白屏、统计不显示、或浏览器还在拿旧 chunk

这是 2026-05-11 这次真实踩过的坑，按这个顺序查。

先对账磁盘、服务、域名是不是同一版：

```bash
find .next/static/chunks/app -name 'page-*.js'
find .next/static/css -type f
curl -s http://127.0.0.1:3000 | grep -o '/_next/static/chunks/app/page-[^"]*js'
curl -s http://127.0.0.1:3000 | grep -o '/_next/static/css/[^"]*css' | head -1
curl -s https://wordislands.cn | grep -o '/_next/static/chunks/app/page-[^"]*js'
curl -s https://wordislands.cn | grep -o '/_next/static/css/[^"]*css' | head -1
```

判断：

- `.next` 和 `127.0.0.1:3000` 不一致：说明 running service 不是最新 build
- `127.0.0.1:3000` 和域名不一致：说明域名入口或浏览器缓存还在吃旧首页 HTML

如果服务没切到新 build：

```bash
sudo systemctl stop English_Learning
sudo fuser -k 3000/tcp || true
rm -rf .next
npm run build
sudo systemctl start English_Learning
sleep 3
```

再核对：

```bash
cat .next/BUILD_ID
curl -s http://127.0.0.1:3000 | grep -o '"buildId":"[^"]*"' | head -1
```

如果服务器端已经是新版本，但浏览器仍然白屏：

- 先用无痕窗口打开站点
- 访问 `https://wordislands.cn/?v=<当前BUILD_ID>`
- 再登录并验收

如果 admin 统计接口已经通了，但页面底部没有那一行，先确认浏览器控制台里：

```js
fetch('/api/auth/me').then(r => r.json()).then(x => x.user?.isAdmin)
fetch('/api/stats').then(async r => ({ status: r.status, body: await r.text() })).then(console.log)
document.body.innerText.includes('总访问')
```

只有在：

- `isAdmin === true`
- `/api/stats` 返回 `200`
- 页面 DOM 里仍然没有 `总访问`

时，才继续怀疑首页前端文件没同步到服务器。

### 9.6 如果 DeepSeek 接口本身失败

可以直接用服务器上的 key 裸测官方接口：

```bash
K=$(grep '^DEEPSEEK_API_KEY=' .env.local | cut -d= -f2-)
curl -s https://api.deepseek.com/chat/completions \
  -H "Authorization: Bearer $K" \
  -H "Content-Type: application/json" \
  -d '{"model":"deepseek-v4-flash","messages":[{"role":"user","content":"Reply with exactly: ok"}],"temperature":0}'
```

## 10. 验证清单

部署完以后，按这个顺序验收：

- `npm run build` 成功
- `sudo systemctl status English_Learning` 是 running
- `curl -I http://127.0.0.1:3000` 返回 `200`
- `curl -I http://127.0.0.1:8083` 返回 `200`
- `curl -I http://你的公网IP:8083` 返回 `200`
- 浏览器能打开首页
- 搜索一个单词能返回结构化结果
- 游客点击收藏会提示登录
- 注册 / 登录后可以收藏单词
- 登录后复习队列只显示当前账号收藏
- admin 邮箱登录后可以看到旧收藏 JSON 导入入口
- admin 邮箱登录后，首页最底端会显示：
  - 总访问
  - 独立访客
  - 注册用户
- 如果有 key，接口返回 `source: "deepseek"`
- `mode: "basic"` 能先返回基础卡片
- `mode: "study"` 能返回完整 Study Card

如果：

- `127.0.0.1:8083` 返回 `200`
- 但 `公网IP:8083` 返回 `Empty reply from server`

那优先检查：

- `listen 8083 default_server`
- `listen [::]:8083 default_server`
- `server_name` 是否写成了你的公网 IP

## 11. 推荐的上线顺序

最稳的顺序是：

1. 先在本地跑通
2. 再把代码传到腾讯云
3. 再配 `.env.local`
4. 再 `npm run build`
5. 再起 systemd
6. 再上 Nginx
7. 最后再开 HTTPS

不要一上来就先折腾 HTTPS。先把应用本体跑起来，别一开始就把问题复杂化。
