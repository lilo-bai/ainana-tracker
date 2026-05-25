// fetch-data.js - 从腾讯文档CSV生成 data.json
// 用法：先用腾讯文档MCP或手动导出各子表CSV，然后运行 node fetch-data.js

const fs = require('fs');
const path = require('path');

// ==================== 配置 ====================
// 把每个子表的CSV内容分别保存到 raw/ 目录下（手动导出或通过MCP获取）
const SHEET_CONFIG = [
  { file: 'raw/通贩场贩.csv',   sheet: '通贩场贩',   idCol: '谷名',   imageCol: '谷图' },
  { file: 'raw/煤骏.csv',       sheet: '煤骏',       idCol: 'ID',     imageCol: '谷图' },
  { file: 'raw/代切.csv',       sheet: '代切',       idCol: 'ID',     imageCol: '谷图' },
  { file: 'raw/国现拼盘.csv',   sheet: '国现拼盘',   idCol: '盘主/出物方', imageCol: 'CN图' },
];

// ==================== CSV解析 ====================
function parseCsv(text) {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const rows = [];
  let currentLine = '';
  for (const line of lines) {
    currentLine += line;
    const quoteCount = (currentLine.match(/"/g) || []).length;
    if (quoteCount % 2 === 0) {
      if (currentLine.trim()) rows.push(parseCsvLine(currentLine));
      currentLine = '';
    } else {
      currentLine += '\n';
    }
  }
  return rows;
}

function parseCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function normalize(v) {
  if (!v) return '/';
  v = v.trim();
  return v === '' || v === ' ' ? '/' : v;
}

// ==================== 主处理 ====================
function processAll() {
  const allItems = [];

  for (const cfg of SHEET_CONFIG) {
    const csvPath = path.join(__dirname, cfg.file);
    if (!fs.existsSync(csvPath)) {
      console.log(`[跳过] 文件不存在: ${cfg.file}`);
      continue;
    }

    const text = fs.readFileSync(csvPath, 'utf-8');
    const rows = parseCsv(text);
    if (rows.length < 2) continue;

    const headers = rows[0];
    const idxId = headers.indexOf(cfg.idCol);
    const idxStatus = headers.indexOf('谷子状态');
    const idxChannel = headers.indexOf('渠道') >= 0 ? headers.indexOf('渠道') : headers.indexOf('类型');
    const idxArrival = headers.indexOf('到货日');
    const idxDDL = headers.indexOf('免费囤货ddl');
    const idxNote = headers.indexOf('备注');
    const idxOrder = headers.indexOf('下单记录');
    const idxImage = headers.indexOf(cfg.imageCol);

    for (let i = 1; i < rows.length; i++) {
      const cols = rows[i];
      if (!cols[idxId] || !cols[idxId].trim()) continue;
      if (!cols[idxStatus] || !cols[idxStatus].trim()) continue;

      allItems.push({
        id: normalize(cols[idxId]),
        channel: idxChannel >= 0 ? normalize(cols[idxChannel]) : '/',
        status: normalize(cols[idxStatus]),
        arrivalDate: idxArrival >= 0 ? normalize(cols[idxArrival]) : '/',
        storageDDL: idxDDL >= 0 ? normalize(cols[idxDDL]) : '/',
        note: idxNote >= 0 ? normalize(cols[idxNote]) : '/',
        orderNote: idxOrder >= 0 ? normalize(cols[idxOrder]) : '/',
        image: idxImage >= 0 ? normalize(cols[idxImage]) : '/',
        sheet: cfg.sheet,
      });
    }

    console.log(`[已处理] ${cfg.sheet}: ${rows.length - 1} 行`);
  }

  const outPath = path.join(__dirname, 'data.json');
  fs.writeFileSync(outPath, JSON.stringify(allItems, null, 2), 'utf-8');
  console.log(`\n生成成功: ${outPath}`);
  console.log(`共 ${allItems.length} 条数据`);

  // 打印状态分布
  const statusMap = {};
  allItems.forEach(x => { statusMap[x.status] = (statusMap[x.status] || 0) + 1; });
  console.log('\n状态分布:');
  Object.entries(statusMap).forEach(([k, v]) => console.log(`  ${k}: ${v}`));
}

processAll();
