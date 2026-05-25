# 爱娜娜随便吃 - 部署与数据同步方案

## 本地预览

```bash
cd ainana-app
python -m http.server 8080
# 或
npx serve -l 8080
```
浏览器打开 http://localhost:8080

---

## 数据结构说明

网页读取的数据格式（JSON 数组）：

```json
[
  {
    "id": "商品ID或谷名",
    "channel": "煤/骏/雅虎/场贩/国现拼盘",
    "status": "谷子状态",
    "arrivalDate": "到货日",
    "storageDDL": "免费囤货ddl",
    "note": "备注",
    "orderNote": "下单记录",
    "image": "图片URL或/",
    "sheet": "来源子表名"
  }
]
```

**图片字段 `image`**：
- 煤骏表取 **谷图** 列
- 通贩场贩取 **谷图** 列
- 国现拼盘取 **CN图** 列
- 为空时网页自动显示渐变色占位图

---

## 腾讯文档数据同步（核心问题）

腾讯文档 **没有 Webhook**，纯前端无法直接读取（需要认证 Token）。有三种方案：

### 方案A：手动更新（当前Demo采用）

**操作流程**：
1. 腾讯文档修改后，手动导出各子表 CSV
2. CSV 放入 `raw/` 目录
3. 运行 `node fetch-data.js` 生成 `data.json`
4. `index.html` 用 `fetch('./data.json')` 加载数据（需要把内嵌数据改为 fetch 加载）
5. git push 到 GitHub，Pages 自动更新

**适用场景**：数据改动不频繁，每天/每周集中更新一次

**优点**：免费、零配置、最安全
**缺点**：非实时，需要手动操作

---

### 方案B：GitHub Action 定时同步（推荐）

**架构**：
```
[腾讯文档] --定时读取--> [GitHub Action] --commit--> [GitHub Pages]
```

**前置条件**：需要有腾讯文档的 API Token（目前腾讯文档开放 API 需企业认证或个人申请开发者权限，具体可到 https://docs.qq.com/open/wiki/developer 查看）。

如果你拿到了 Token，在仓库添加 `.github/workflows/sync.yml`：

```yaml
name: Sync Tencent Docs
on:
  schedule:
    - cron: '*/15 * * * *'  # 每15分钟
  workflow_dispatch:
jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Fetch data from Tencent Docs
        env:
          TD_TOKEN: ${{ secrets.TENCENT_DOCS_TOKEN }}
        run: |
          # 调用腾讯文档API拉取各子表CSV，保存到raw/目录
          # 这里需要写具体的API调用脚本
          node scripts/fetch-from-api.js
      - name: Build data
        run: node fetch-data.js
      - name: Commit
        run: |
          git config user.name bot
          git config user.email bot@example.com
          git add data.json
          git diff --staged --quiet || git commit -m "sync data $(date +%Y-%m-%d-%H:%M)"
          git push
```

**更新频率**：GitHub Action 最短支持 5 分钟调度，实际约 5~15 分钟延迟

**优点**：全自动、免费、无需额外服务器
**缺点**：需要申请腾讯文档 API Token；最短5分钟调度限制

---

### 方案C：Cloudflare Workers 后端代理（最接近实时）

**架构**：
```
[浏览器] <-- fetch --> [Cloudflare Workers] <-- 定时拉取 --> [腾讯文档API]
                            |
                            v
                        [KV缓存]
```

**前置条件**：腾讯文档 API Token + Cloudflare 账号

**Workers 代码**（定时拉取 + API代理）：
```javascript
// 每5分钟从腾讯文档拉取数据存入 KV
deployment:
  name: ainana-data
  schedule:
    - cron: '*/5 * * * *'

async function syncData(env) {
  // 调用腾讯文档API获取各子表数据
  const data = await fetchTencentDocs(env.TD_TOKEN);
  await env.KV.put('ainana_data', JSON.stringify(data), { expirationTtl: 3600 });
}

export default {
  async fetch(request, env) {
    const data = await env.KV.get('ainana_data', { type: 'json' });
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  },
  async scheduled(event, env) {
    await syncData(env);
  }
};
```

**前端改为一行**：
```javascript
const RAW_DATA = await fetch('https://ainana-data.your-account.workers.dev').then(r => r.json());
```

**更新频率**：约 5 分钟（理论上可以做到 1 分钟）

**优点**：接近实时、前端零改动、Cloudflare KV 免费额度足够
**缺点**：需要 Cloudflare 账号 + 腾讯文档 API Token，有一定配置复杂度

---

## 图片同步说明

**谷图/CN图列里的内容是什么？**
- 可以是图片URL（http/https 链接）
- 可以是空值（显示占位图）
- 数据库文档结构确认后，fetch-data.js 会自动读取第10列（谷图）或对应列（CN图）作为 `image` 字段

**图片如何传进去？**
1. 在腾讯文档对应行的谷图/CN图列填入图片URL
2. 同步后前端会自动 `<img src="URL">` 渲染
3. 如果图片是本地文件，需要先上传到图床或CDN，再把URL填入表格

---

## 推荐实施路径

| 阶段 | 动作 | 同步方案 |
|------|------|----------|
| **Phase 1** | 先用当前Demo（内嵌数据）部署到 GitHub Pages 验证效果 | 无 |
| **Phase 2** | 接入全量2000+条数据，改为 `fetch('./data.json')` 加载 | 方案A（手动） |
| **Phase 3** | 申请腾讯文档API Token，搭建自动同步 | 方案B（GitHub Action） |
| **Phase 4** | 需要更快更新时，升级到 Cloudflare Workers | 方案C（Workers） |

**Phase 1 现在就能做**：我可以帮你把当前代码推送到 GitHub 仓库并启用 GitHub Pages。

---

## 部署到 GitHub Pages（Phase 1）

```bash
# 1. 创建GitHub仓库（如 lilo-bai/ainana-goods）
# 2. 推送代码
git init
git add .
git commit -m "init"
git remote add origin https://github.com/lilo-bai/ainana-goods.git
git push -u origin main
# 3. 仓库 Settings > Pages > Source 选择 main / root
# 4. 访问 https://lilo-bai.github.io/ainana-goods
```
