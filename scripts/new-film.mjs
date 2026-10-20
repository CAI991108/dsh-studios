#!/usr/bin/env node
// 开新片：把 template/ 复制成一个独立工程，装好字体，然后跑一次派生。
//
//   node scripts/new-film.mjs <新片目录> [--from=定稿.json] [--fonts=<字体目录>] [--force]
//
// 复制只做这一次。之后改片一律回片子目录里跑 `npm run derive`，不要重跑本脚本。
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';

const skillDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const templateDir = path.join(skillDir, 'template');
const args = process.argv.slice(2);
const flags = Object.fromEntries(
  args
    .filter((a) => a.startsWith('--'))
    .map((a) => {
      const [k, v = 'true'] = a.replace(/^--/, '').split('=');
      return [k, v];
    }),
);
const target = args.find((a) => !a.startsWith('--'));
if (!target) {
  console.error('用法：node scripts/new-film.mjs <新片目录> [--from=定稿.json] [--fonts=<字体目录>] [--force]');
  process.exit(1);
}

const dest = path.resolve(target);
if (fs.existsSync(dest) && fs.readdirSync(dest).length && !flags.force) {
  console.error(`目标目录已存在且非空：${dest}\n确认要覆盖就加 --force。\n只想改片、重算时间轴：进片子目录跑 npm run derive。`);
  process.exit(1);
}

// ── 1 复制骨架 ──────────────────────────────────────────────
fs.mkdirSync(dest, {recursive: true});
fs.cpSync(templateDir, dest, {
  recursive: true,
  filter: (src) => {
    const rel = path.relative(templateDir, src);
    if (!rel) return true;
    const first = rel.split(path.sep)[0];
    return !['node_modules', '.cache', 'exports'].includes(first);
  },
});
console.log(`✓ 复制骨架 → ${dest}`);

// ── 2 字体（骨架不带 19MB 字体，从仓库里取一份）───────────────
const fontCandidates = [
  flags.fonts,
  path.join(skillDir, 'assets/fonts'),
  path.resolve(process.cwd(), 'public/fonts'),
].filter(Boolean);
const fontDir = fontCandidates.find((d) => fs.existsSync(d) && fs.readdirSync(d).some((f) => /\.(ttf|otf|woff2?)$/i.test(f)));
if (fontDir) {
  fs.mkdirSync(path.join(dest, 'public/fonts'), {recursive: true});
  for (const f of fs.readdirSync(fontDir)) fs.copyFileSync(path.join(fontDir, f), path.join(dest, 'public/fonts', f));
  console.log(`✓ 字体与授权 ← ${fontDir}`);
} else {
  console.warn('! 没找到字体。把 .ttf 放进片子的 public/fonts/，并让 film/film.config.json 的 font.file 指向它。');
}

// ── 3 定稿 ──────────────────────────────────────────────────
const destSubmission = path.join(dest, '定稿.json');
if (flags.from) {
  const from = path.resolve(flags.from);
  if (!fs.existsSync(from)) {
    console.error(`找不到定稿：${from}`);
    process.exit(1);
  }
  fs.copyFileSync(from, destSubmission);
  console.log(`✓ 定稿 ← ${from}`);
}

// ── 4 派生 ──────────────────────────────────────────────────
const derive = spawnSync(process.execPath, [path.join(dest, 'scripts/derive.mjs')], {cwd: dest, stdio: 'inherit'});
if (derive.status !== 0) process.exit(derive.status || 1);

console.log(`
下一步（顺序不要换）：
  1. cd ${path.relative(process.cwd(), dest) || '.'}
  2. npm install                    第一次装依赖
  3. npm run qa                     定稿门 + 时间轴 + 素材，先看它红不红
  4. npm run start                  起编辑台，浏览器里看片改字
  5. npm run render                 出 带配乐版 + 无配乐版 + 封面
  6. npm run qa                     出片后再跑一次，产物与凭据泄漏都在这步

改片之后：改 定稿.json，然后 npm run derive —— 不要重跑本脚本。
`);
