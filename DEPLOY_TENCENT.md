# 腾讯云部署说明

这份说明对应的是当前这套 Next.js 英语学习站，不是仓库里早期的静态原型。

目标很简单：

- 网站跑在腾讯云 CVM 上
- 通过 Nginx 对外提供 `80/443`
- OpenRouter Key 放在服务器环境里，不进前端代码
- 如果服务器直连 OpenRouter 不通，可以切到代理或兼容接口

## 1. 服务器准备

推荐配置：

- 系统：Ubuntu 22.04 / 24.04
- 内存：2 GB 起步，4 GB 更稳
- Node.js：18.18+，建议 20 LTS
- 公网出站：能访问 `openrouter.ai:443`

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
OPENROUTER_API_KEY=你的key
OPENROUTER_MODEL=openrouter/auto
OPENROUTER_API_URL=https://openrouter.ai/api/v1/chat/completions
EOF
```

说明：

- `OPENROUTER_API_KEY` 是真正的密钥
- `OPENROUTER_MODEL` 推荐写 `openrouter/auto`，先让站点稳定可用
- `OPENROUTER_API_URL` 默认就是 OpenRouter 官方地址的 `chat/completions` 端点
- 如果你想给 OpenRouter 带上站点信息，可以再加：

```bash
cat > .env.local <<'EOF'
OPENROUTER_API_KEY=你的key
OPENROUTER_MODEL=openrouter/auto
OPENROUTER_API_URL=https://openrouter.ai/api/v1/chat/completions
OPENROUTER_HTTP_REFERER=https://your-site.example
OPENROUTER_TITLE=English_Learning
EOF
```

如果你只提供 `OPENROUTER_BASE_URL` 或 `OPENAI_BASE_URL`，代码也会自动补成 `/chat/completions` 端点。

如果你不想把 key 写到文件里，也可以直接在系统环境变量里导出，但 `.env.local` 最简单。

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
curl -s http://127.0.0.1:3000/api/translate -H 'Content-Type: application/json' -d '{"query":"salient"}'
```

如果 API 返回的是 `source: "openrouter"`，说明服务器已经成功读取到 key 并打通模型请求。

如果 API 返回的是 `source: "openrouter"`，说明服务器已经成功读取到 key 并打通模型请求。

如果返回 `source: "mock"`，说明：

- 你的 `OPENROUTER_API_KEY` 没有被读到
- 或者 OpenAI 请求失败了
- 或者服务器出网被拦了
- 或者你填写了 `OPENROUTER_BASE_URL`，但使用的是旧代码

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

推荐正式环境直接使用 80 端口模板，然后把 `server_name` 改成你的域名。

安装到 Nginx：

```bash
sudo cp nginx/English_Learning.conf /etc/nginx/sites-available/English_Learning
sudo ln -sf /etc/nginx/sites-available/English_Learning /etc/nginx/sites-enabled/English_Learning
sudo nginx -t
sudo systemctl reload nginx
```

如果你只是临时用 IP 测试，也可以先把 `server_name` 保持为 `_`。

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

## 9. OpenAI 连不上的排查

这是最容易卡住的地方，按这个顺序查。

### 9.1 先确认环境变量

```bash
cat .env.local
```

至少要看到：

- `OPENROUTER_API_KEY=...`
- `OPENROUTER_MODEL=openrouter/auto`

### 9.2 确认服务已经重启

```bash
sudo systemctl restart English_Learning
sudo journalctl -u English_Learning -n 50 --no-pager
```

### 9.3 确认服务器能出网

```bash
curl -I https://openrouter.ai
```

如果这里都不通，问题不是代码，是腾讯云服务器的出网网络或者代理。

### 9.4 如果出网不通

你有三种办法：

- 换一个能正常出网的腾讯云地域或机器
- 配服务器侧代理
- 把 `OPENROUTER_API_URL` 改成你自己的 OpenRouter-compatible 接口地址

## 10. 验证清单

部署完以后，按这个顺序验收：

- `npm run build` 成功
- `sudo systemctl status English_Learning` 是 running
- `curl -I http://127.0.0.1:3000` 返回 `200`
- 浏览器能打开首页
- 搜索一个单词能返回结构化结果
- 如果有 key，接口返回 `source: "openrouter"`
- 如果没有 key，至少能回退到 `source: "mock"`

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
