# 公网部署指南

Lecture Study Coach 是标准 Next.js 应用，可以部署到任意支持 Node.js 的平台。**不需要数据库**。每个访问者在浏览器里填自己的 API key（BYOK），你不需要在服务器上放密钥。

## 部署前须知

| 项目 | 说明 |
| --- | --- |
| API key | **不要**在服务器环境变量里放你的个人 key 给所有人共用；让同学在 **Model** 里各自粘贴 |
| 长 PDF | 提纲生成可能 30–120 秒，选支持长超时的平台 |
| Ollama | 公网部署**无法**用你本机的 Ollama；同学应选 Groq / OpenRouter / DeepSeek |
| Demo | **Load demo lecture** 无需 key，适合先体验 |

---

## 方案 A：Vercel（最简单，适合分享链接）

适合：快速给同学一个 `https://xxx.vercel.app` 链接。

### 步骤

1. 把代码推到 **GitHub**（确保没有 `.env.local`）。
2. 打开 [vercel.com](https://vercel.com) → **Add New Project** → 导入仓库。
3. Framework 选 **Next.js**，其余默认即可 → **Deploy**。
4. 部署完成后把链接发给同学。

### 环境变量

**可以不填任何环境变量。** 同学在网页 **Model** 里粘贴自己的 Groq key 即可。

### 超时限制（重要）

- 免费 Hobby：Serverless 函数默认约 **10–60 秒**（地区/配置不同）。
- 本项目 `/api/llm` 已配置最长 **120 秒**（见 `vercel.json`），**完整 120 秒通常需要 Vercel Pro**。
- 若提纲经常超时：换 **Railway**（方案 B），或让同学用较短 PDF / 分章节上传。

### 自定义域名（可选）

Vercel 项目 → **Settings → Domains** → 绑定你的域名。

---

## 方案 B：Railway（推荐，长 PDF 更稳）

适合：需要较长 LLM 请求、不想被 Serverless 超时卡住。

### 步骤

1. 代码推到 GitHub。
2. 打开 [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**。
3. 选中本仓库；Railway 会自动检测 Node 项目。
4. **Settings → Networking → Generate Domain**，得到公网 URL（如 `https://xxx.up.railway.app`）。
5. 确认 **Start Command** 为：

   ```bash
   npm run start
   ```

   （会读取 Railway 注入的 `PORT` 环境变量。）

6. **Deploy** 完成后访问生成的域名。

### 环境变量（可选）

| 变量 | 是否必填 | 说明 |
| --- | --- | --- |
| 无 | — | BYOK 模式下同学自带 key |

---

## 方案 C：Render

1. [render.com](https://render.com) → **New → Web Service** → 连接 GitHub 仓库。
2. **Runtime**: Node  
   **Build Command**: `npm install && npm run build`  
   **Start Command**: `npm run start`
3. **Instance type**: Free 档可能休眠；付费档更稳定。
4. 创建后得到 `https://xxx.onrender.com`。

---

## 方案 D：Docker（VPS / 任意云主机）

适合：有自己的服务器（阿里云、腾讯云、DigitalOcean 等）。

```bash
# 在仓库根目录
docker build -t lecture-study-coach .
docker run -p 43127:43127 lecture-study-coach
```

浏览器访问 `http://<服务器公网IP>:43127`。

生产环境建议前面加 **Nginx + HTTPS**（Let’s Encrypt），并把 43127 反向代理到 443 端口。

---

## 同学公网使用流程

1. 打开你发的链接（如 `https://study.example.com`）。
2. **Model** → 选 **Groq**（或 OpenRouter / DeepSeek）。
3. 粘贴**自己的** API key → **Test connection**。
4. 上传 PDF 或 **Load demo lecture**。
5. 手机浏览器同样可用（响应式布局）；PDF 用「选择文件」上传。

每个浏览器各自保存 key 和学习进度（localStorage），互不影响。

---

## 安全 checklist（分享前）

- [ ] 仓库与镜像中**没有** `.env.local`
- [ ] 没有在 `NEXT_PUBLIC_*` 里放 API key
- [ ] 若用 Vercel/Railway 环境变量，只放**可选**的公共配置，不放个人 key
- [ ] 告知同学：key 只存在各自浏览器，经你的服务器**转发**到 Groq 等官方 API

---

## 常见问题

**Q: 部署后 Model 测试失败？**  
A: 检查 key 是否有效、模型 id 是否在对应平台存在（如 `qwen/qwen3.8-27b`）。

**Q: Extract outline 一直转圈然后失败？**  
A: 多半是平台超时。换 Railway/Docker，或缩短 PDF。

**Q: 能否我统一提供一个 key 给全班？**  
A: 技术上可在服务器设 `GROQ_API_KEY`，但不推荐——费用、限流、泄露风险都由你承担。BYOK 更安全。

**Q: 和本地 `npm run dev` 有什么区别？**  
A: 功能相同；公网多了 HTTPS 域名，同学不用和你同一 Wi‑Fi。
