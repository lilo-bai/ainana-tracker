# 推送指引

## 当前状态
- 本地已修复图片映射bug（drawing row 0-based → sheet row 1-based 偏移）
- data.json 已更新：963条数据，946张图片正确匹配
- 本地有两个待推送的commit：
  - `9922635` fix: 修复图片行号偏移bug，946张图片正确匹配（data.json）
  - `fc8f446` fix: 更新图片文件（946张，扩展名统一）

## 推送方法

### 方法1：命令行推送（需要网络）
```bash
cd D:\AIIII\2026-05-25-task-33\ainana-app
git push origin main
```

### 方法2：通过GitHub网页上传 data.json（推荐，快速生效）
1. 打开 https://github.com/lilo-bai/ainana-tracker/edit/main/data.json
2. 将本地 `D:\AIIII\2026-05-25-task-33\ainana-app\data.json` 的内容粘贴进去
3. 提交修改
4. 等待GitHub Pages部署（1-2分钟）

### 方法3：删除旧图片后推送（减小推送体积）
由于图片扩展名变化（.png↔.jpg），git需要删除旧文件+创建新文件，导致推送体积过大。
可以只在GitHub网页上更新data.json，图片文件通过删除旧目录后重新推送。

## 验证本地数据
```bash
cd D:\AIIII\2026-05-25-task-33\ainana-app
# 启动本地预览
python -m http.server 8080
# 浏览器打开 http://localhost:8080
```
