/**
 * 用 voice-script.json 的 caption 重写 film/timing.json 的字幕轨。
 *
 * 做法：
 *  - 逐条对照 shot id，取该镜头现有字幕占用的时间窗（第一字起 ~ 最后一字落），
 *    不碰镜头的 from/duration，也不碰配音的 voiceFrom/voiceDuration；
 *  - caption 按句号/问号/叹号切句，一句一条；单句太宽（>22 字宽，约 1320px）才按
 *    逗号/顿号折行，折行时尽量按宽度均分；
 *  - 时间按字宽（CJK 1、西文 0.55）比例分配，条与条之间留 3 帧气口。
 *
 * 用法：node scripts/apply-voice-script.cjs [--dry-run]
 */
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const dry = process.argv.includes('--dry-run');
const scriptFile = path.join(root, 'voice-script.json');
const timingFile = path.join(root, 'film', 'timing.json');

const script = JSON.parse(fs.readFileSync(scriptFile, 'utf8').replace(/^\uFEFF/, ''));
const timingText = fs.readFileSync(timingFile, 'utf8');
const timing = JSON.parse(timingText);

/** 显示宽度：CJK / 全角 = 1，西文 = 0.55，空格 = 0.35，组合符 = 0 */
const charWidth = (ch) => {
  if (/[\u0300-\u036f\ufe0e\ufe0f]/u.test(ch)) return 0;
  if (/[\u2e80-\u9fff\uf900-\ufaff\uff01-\uff60\u3000-\u303f]/u.test(ch)) return 1;
  if (ch === ' ') return 0.35;
  return 0.55;
};
const width = (s) => [...s].reduce((w, ch) => w + charWidth(ch), 0);

const MAX_LINE = 22; // 22 字宽 ≈ 1320px，60px 字号下留足两边安全区
const TARGET_LINE = 16;
const GAP = 3; // 帧
// 这些镜头整句一条字幕，不按标点拆
const KEEP_WHOLE = new Set(['hook']);

/** 按句末标点切句，标点留在句尾 */
const sentences = (text) => {
  const out = [];
  let buf = '';
  for (const ch of text) {
    buf += ch;
    if (/[。！？!?]/u.test(ch)) {
      if (buf.trim()) out.push(buf.trim());
      buf = '';
    }
  }
  if (buf.trim()) out.push(buf.trim());
  return out.length ? out : [text.trim()];
};

/** 长句按逗号/顿号/分号/冒号切成分句 */
const clauses = (text) => {
  const out = [];
  let buf = '';
  for (const ch of text) {
    buf += ch;
    if (/[，、；：]/u.test(ch)) {
      out.push(buf);
      buf = '';
    }
  }
  if (buf) out.push(buf);
  return out;
};

/** 一句 → 一到多行字幕 */
const wrap = (text) => {
  const w = width(text);
  if (w <= MAX_LINE) return [text];
  const n = Math.ceil(w / TARGET_LINE);
  const lineMax = Math.max(12, w / n + 2);
  const pieces = clauses(text);
  const lines = [];
  let cur = '';
  for (const p of pieces) {
    if (cur && width(cur + p) > lineMax) {
      lines.push(cur);
      cur = p;
    } else {
      cur += p;
    }
  }
  if (cur) lines.push(cur);
  return lines;
};

/** 该镜头现有字幕占用的时间窗 */
const captionWindow = (shot) => {
  const cs = timing.captions.filter((c) => c.from >= shot.from && c.from < shot.from + shot.duration);
  if (!cs.length) return null;
  return {
    from: Math.min(...cs.map((c) => c.from)),
    end: Math.max(...cs.map((c) => c.from + c.duration)),
  };
};

/** 在时间窗里按字宽分配每条字幕的起始帧与时长 */
const distribute = (from, end, lines) => {
  const total = end - from;
  const gaps = Math.max(0, lines.length - 1) * GAP;
  const avail = total - gaps;
  if (avail <= lines.length) throw new Error(`时间窗 ${from}-${end} 太短，放不下 ${lines.length} 条字幕`);
  const ws = lines.map(width);
  const sum = ws.reduce((a, b) => a + b, 0);
  const exact = ws.map((w) => (avail * w) / sum);
  const durs = exact.map(Math.floor);
  let rem = avail - durs.reduce((a, b) => a + b, 0);
  const order = exact.map((v, i) => ({ i, frac: v - Math.floor(v) })).sort((a, b) => b.frac - a.frac);
  for (let k = 0; k < rem; k++) durs[order[k % durs.length].i]++;
  let cursor = from;
  return lines.map((text, i) => {
    const item = { id: null, from: cursor, duration: durs[i], text };
    cursor += durs[i] + GAP;
    return item;
  });
};

let globalIndex = 0;
const captions = [];
const rows = [];

for (const shot of timing.shots) {
  const entry = script.find((s) => s.id === shot.id);
  if (!entry) continue;
  const win = captionWindow(shot);
  if (!win) {
    console.warn(`! ${shot.id} 在 timing.json 里没有字幕窗口，跳过`);
    continue;
  }
  const lines = KEEP_WHOLE.has(shot.id) ? wrap(entry.caption) : sentences(entry.caption).flatMap(wrap);
  const timed = distribute(win.from, win.end, lines);
  for (const item of timed) {
    item.id = `${shot.id}-${globalIndex++}`;
    captions.push(item);
  }
  rows.push({ shot: shot.id, window: `${win.from}-${win.end}`, lines: lines.map((l) => `${l} (${width(l).toFixed(1)})`) });
}

const known = new Set(timing.shots.map((s) => s.id));
for (const s of script) if (!known.has(s.id)) console.warn(`! voice-script 里的 ${s.id} 在 timing.json 里找不到对应镜头`);

const maxW = Math.max(...captions.map((c) => width(c.text)));
console.log(`\n镜头   时间窗      字幕`);
for (const r of rows) console.log(`${r.shot.padEnd(8)} ${r.window.padEnd(10)} ${r.lines.join(' / ')}`);
console.log(`\n共 ${captions.length} 条字幕（原 ${timing.captions.length} 条），最宽 ${maxW.toFixed(1)} 字宽 ≈ ${Math.round(maxW * 60)}px`);

// 基本校验
for (const c of captions) {
  if (!c.text.trim()) throw new Error(`空字幕 ${c.id}`);
  if (width(c.text) > MAX_LINE + 2) throw new Error(`超宽字幕 ${c.id}: ${c.text}`);
}
for (let i = 1; i < captions.length; i++) {
  const prev = captions[i - 1];
  if (prev.from + prev.duration > captions[i].from) throw new Error(`字幕重叠 ${prev.id} / ${captions[i].id}`);
}

if (dry) {
  console.log('\n[dry-run] 未写入 film/timing.json');
  process.exit(0);
}

// 备份原始时间线到 .cache（不进交付）
const backup = path.join(root, '.cache', 'timing.before-voice-script.json');
fs.mkdirSync(path.dirname(backup), { recursive: true });
fs.writeFileSync(backup, timingText, 'utf8');

timing.captions = captions;
fs.writeFileSync(timingFile, JSON.stringify(timing, null, 2) + '\n', 'utf8');
console.log(`\n已写入 film/timing.json；原文件备份在 .cache/timing.before-voice-script.json`);
