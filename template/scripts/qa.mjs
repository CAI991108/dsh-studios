// 验收门：把「验收记录」从一张手抄表变成一条命令。
//   node scripts/qa.mjs            正常验收（有错误就退出码 1）
//   node scripts/qa.mjs --draft    允许还有「待定」的拍（草稿阶段自查）
// 只做**能自动判**的那部分。逐帧看画面、听混音、审版权，仍然要人。
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const draft = process.argv.includes('--draft');
const errors = [];
const warns = [];
const oks = [];

const err = (m) => errors.push(m);
const warn = (m) => warns.push(m);
const ok = (m) => oks.push(m);
const readJson = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8').replace(/^\uFEFF/, ''));
const exists = (p) => fs.existsSync(path.join(root, p));

const 定稿 = exists('定稿.json') ? readJson('定稿.json') : null;
const timing = exists('film/timing.json') ? readJson('film/timing.json') : null;
const config = exists('film/film.config.json') ? readJson('film/film.config.json') : null;

// ── 1 定稿门 ────────────────────────────────────────────────
const PENDING = new Set(['待改', '提议', '待选', '待定']);
let sceneNames = null;
if (exists('film/scenes/index.tsx')) {
  const src = fs.readFileSync(path.join(root, 'film/scenes/index.tsx'), 'utf8');
  const block = /export const SCENES[^=]*=\s*\{([\s\S]*?)\}/.exec(src);
  if (block) sceneNames = [...block[1].matchAll(/([A-Za-z0-9_$-]+)\s*:\s*[A-Za-z]/g)].map((m) => m[1]);
  if (sceneNames) ok(`镜头注册表读到 ${sceneNames.length} 种：${sceneNames.join(' / ')}`);
  else warn('没能从 film/scenes/index.tsx 解析出 SCENES，跳过 scene 校验');
}

if (!定稿) err('缺 定稿.json —— 这台机器只从定稿开拍');
else {
  const beats = 定稿.beats || [];
  if (!beats.length) err('定稿.json 的 beats 是空的');
  const ids = new Set();
  for (const b of beats) {
    if (!b.id) err('有 beat 没写 id');
    else if (ids.has(b.id)) err(`beat id 重复：${b.id}`);
    ids.add(b.id);
    if (!(b.frames > 0)) err(`beat ${b.id} 的 frames 不是正数`);
    if (!b.scene) err(`beat ${b.id} 没写 scene`);
    else if (sceneNames && !sceneNames.includes(b.scene)) err(`beat ${b.id} 的 scene「${b.scene}」没在 scenes/index.tsx 注册`);
    if (!draft && PENDING.has(b.status)) err(`beat ${b.id} 还是「${b.status}」——没过定稿门不许出片`);
    if (!b.status) err(`beat ${b.id} 没写 status`);
    if (b.caption && b.caption.length > 18) warn(`beat ${b.id} 的字幕 ${b.caption.length} 字，超过一行 18 字`);
    if (b.caption && (b.frames / (config?.fps || 30)) < 1.2) warn(`beat ${b.id} 的字幕停留不到 1.2 秒`);
  }
  const sum = beats.reduce((n, b) => n + (b.frames || 0), 0);
  if (timing && sum !== timing.total) err(`定稿 frames 合计 ${sum}，timing.json total 是 ${timing.total}`);
  else if (timing) ok(`定稿 ${beats.length} 拍，合计 ${sum} 帧`);
}

// ── 2 时间轴 ────────────────────────────────────────────────
if (!timing) err('缺 film/timing.json');
else {
  if (!config) err('缺 film/film.config.json');
  if (!(timing.total > 0)) err('timing.total 不是正数');
  let cursor = 0;
  for (const s of timing.shots || []) {
    if (s.from !== cursor) err(`镜头 ${s.id} 起点 ${s.from} 与前一段末尾 ${cursor} 对不上（空隙会露黑场，重叠会盖画面）`);
    cursor = s.from + s.duration;
    if (!(s.duration > 0)) err(`镜头 ${s.id} 时长不是正数`);
    if (!s.scene) err(`镜头 ${s.id} 没写 scene`);
  }
  if (cursor !== timing.total) err(`镜头末尾 ${cursor} 与 total ${timing.total} 对不上`);
  for (const c of timing.captions || []) {
    if (c.from < 0 || c.from + c.duration > timing.total) err(`字幕 ${c.id} 超出片长`);
    if (!c.text) err(`字幕 ${c.id} 没内容`);
  }
  const caps = [...(timing.captions || [])].sort((a, b) => a.from - b.from);
  for (let i = 1; i < caps.length; i++)
    if (caps[i].from < caps[i - 1].from + caps[i - 1].duration) warn(`字幕 ${caps[i - 1].id} 与 ${caps[i].id} 时间重叠`);
  if (!errors.length) ok(`时间轴连续：${timing.shots.length} 镜 / ${timing.captions.length} 条字幕 / ${timing.total} 帧`);
}

// ── 3 素材 ──────────────────────────────────────────────────
const need = new Set();
for (const s of timing?.shots || []) if (s.src) need.add(s.src);
for (const c of timing?.sfx || []) if (c.src) need.add(c.src);
if (config?.music?.src) need.add(config.music.src);
for (const p of need) if (!exists(path.join('public', p))) err(`素材缺文件：public/${p}`);
if (need.size && !errors.some((e) => e.startsWith('素材缺'))) ok(`引用的 ${need.size} 个素材文件都在 public/`);

// ── 4 台账与泄漏 ────────────────────────────────────────────
if (!exists('docs/sources.md')) warn('没有 docs/sources.md：字体/音效/配乐来源与授权没记台账');
const LEAK = [/sk-[A-Za-z0-9]{16,}/, /api[_-]?key\s*[:=]\s*['"][^'"]{8,}/i, /Bearer\s+[A-Za-z0-9._-]{20,}/];
const ABS = [/[A-Za-z]:\\\\?Users\\\\?[^\\\/"']+/i, /\/(Users|home)\/[a-z0-9._-]+\//i];
const scan = ['定稿.json', 'film/timing.json', 'film/film.config.json', 'film/workbench.ts'].filter(exists);
for (const p of scan) {
  const t = fs.readFileSync(path.join(root, p), 'utf8');
  for (const re of LEAK) if (re.test(t)) err(`${p} 里疑似凭据：${re}`);
  for (const re of ABS) if (re.test(t)) err(`${p} 里有绝对本机路径：${re}`);
}
ok(`扫过 ${scan.length} 个文件：凭据 / 绝对路径`);

// ── 5 产物 ──────────────────────────────────────────────────
const exp = path.join(root, 'exports');
if (fs.existsSync(exp)) {
  for (const f of fs.readdirSync(exp).filter((f) => f.endsWith('.mp4'))) {
    const buf = fs.readFileSync(path.join(exp, f));
    const sha = crypto.createHash('sha256').update(buf).digest('hex').slice(0, 16);
    const mb = (buf.length / 1048576).toFixed(1);
    if (buf.length < 2048) err(`exports/${f} 只有 ${buf.length} 字节，几乎肯定是坏片`);
    else ok(`exports/${f} · ${mb} MB · sha256 ${sha}…`);
  }
}

// ── 6 代码编得过 ────────────────────────────────────────────
// 这一条是踩出来的：`tsconfig` 的 include 若不含 `film/`，`tsc` 会对着半套代码发绿，
// 而真正的错要等到渲染时才炸。门要覆盖得到，光严格没用。
const tscBin = 'node_modules/typescript/lib/tsc.js';
if (!exists(tscBin)) warn('没装依赖（node_modules/typescript 不在），跳过类型检查；跑一次 npm install 就能查上');
else {
  const r = spawnSync(process.execPath, [tscBin, '--noEmit'], {cwd: root, encoding: 'utf8'});
  const out = `${r.stdout ?? ''}${r.stderr ?? ''}`.trim();
  if (r.status === 0) ok('类型检查通过（src + film）');
  else err(`类型检查失败：\n${out.split('\n').slice(0, 8).map((l) => '      ' + l).join('\n')}`);
}

// ── 报告 ────────────────────────────────────────────────────
const line = (m) => console.log(m);
line('');
for (const m of oks) line(`  ✓ ${m}`);
for (const m of warns) line(`  ! ${m}`);
for (const m of errors) line(`  ✗ ${m}`);
line('');
if (errors.length) {
  line(`验收不通过：${errors.length} 个错误，${warns.length} 个提醒。`);
  process.exitCode = 1;
} else {
  line(`验收通过${warns.length ? `（${warns.length} 个提醒，看一眼）` : ''}。出片后仍要人工过：逐帧隐私、混音、版权。`);
}
