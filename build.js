// node build.js → 產生 index.html(本機開啟)與 artifact.html(單檔、供發佈)
const fs = require('fs');
const src = fs.readFileSync('src.html', 'utf8');
const params = fs.readFileSync('params.js', 'utf8');
const calc = fs.readFileSync('calc.js', 'utf8');
const MARK = '<script>/*APP*/';
if (!src.includes(MARK)) throw new Error('src.html 找不到 ' + MARK);
const head = '<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">';
const inline = `<script>\n${params}\n</script>\n<script>\n${calc}\n</script>\n`;
const local = '<script src="params.js"></script>\n<script src="calc.js"></script>\n';
fs.writeFileSync('index.html', head + '</head><body>' + src.replace(MARK, local + MARK) + '</body></html>');
fs.writeFileSync('artifact.html', src.replace(MARK, inline + MARK));
console.log('built');
