#!/usr/bin/env node
// 派生：定稿.json → film/timing.json + film/film.config.json
//
//   node scripts/derive.mjs
//
// 这一步可以反复跑，只重写那两个文件，不碰 scenes/ 、src/ 、public/。
// 「改定稿，重跑派生」是这支片子唯一的改片方式。
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8').replace(/^\uFEFF/, ''));
const writeJson = (p, v) => fs.writeFileSync(path.join(root, p), JSON.stringify(v, null, 2) + '\n');

if (!fs.existsSync(path.join(root, '定稿.json'))) {
  console.error('找不到 定稿.json。派生只从定稿出发。');
  process.exit(1);
}
const 定稿 = readJson('定稿.json');
const beats = 定稿.beats || [];
if (!beats.length) {
  console.error('定稿.json 里没有 beats。');
  process.exit(1);
}

const spec = {width: 1920, height: 1080, fps: 30, ...(定稿.spec || {})};
const CAPTION_IN = 6; // 拍首留 6 帧气口
const CAPTION_OUT = 6;
const MIN_CAPTION = 24;
const warnings = [];
let cursor = 0;
const shots = [];
const captions = [];
const atFrame = new Map();

for (const b of beats) {
  if (!b.id || !b.scene || !(b.frames > 0)) {
    console.error(`beat 缺字段（id / scene / frames）：${JSON.stringify(b).slice(0, 120)}`);
    process.exit(1);
  }
  if (atFrame.has(b.id)) {
    console.error(`beat id 重复：${b.id}`);
    process.exit(1);
  }
  atFrame.set(b.id, cursor);
  const shot = {id: b.id, scene: b.scene, from: cursor, duration: b.frames, headline: b.headline ?? ''};
  if (b.params && Object.keys(b.params).length) shot.params = b.params;
  if (b.voice) {
    shot.src = b.voice;
    shot.voiceFrom = b.voiceFrom ?? 12;
    shot.voiceDuration = b.voiceFrames ?? 0;
    if (!b.voiceFrames) warnings.push(`beat ${b.id} 有 voice 但没写 voiceFrames，旁白会按 0 帧处理`);
  } else {
    shot.voiceFrom = 0;
    shot.voiceDuration = 0;
    shot.src = '';
  }
  shots.push(shot);

  const lines = b.captions ?? (b.caption ? [b.caption] : []);
  if (lines.length) {
    const win = Math.max(MIN_CAPTION, b.frames - CAPTION_IN - CAPTION_OUT);
    const each = Math.floor(win / lines.length);
    lines.forEach((text, i) => {
      const duration = i === lines.length - 1 ? win - i * each : each;
      captions.push({id: `${b.id}-${i + 1}`, from: cursor + CAPTION_IN + i * each, duration, text});
    });
  }
  cursor += b.frames;
}

const sfx = (定稿.sfx || [])
  .map((s, i) => {
    const base = atFrame.get(s.at);
    if (base === undefined) {
      warnings.push(`音效 #${i} 挂在未知的 beat「${s.at}」上，已忽略`);
      return null;
    }
    return {from: base + (s.offset ?? 0), duration: s.duration ?? 90, src: s.src, volume: s.volume ?? 1};
  })
  .filter(Boolean);

writeJson('film/timing.json', {total: cursor, shots, captions, sfx});
console.log(`✓ film/timing.json：${shots.length} 镜 / ${captions.length} 条字幕 / ${cursor} 帧（${(cursor / spec.fps).toFixed(1)} 秒）`);

// 身份与几何：片名、规格、配乐、封面、配色
const cfgPath = 'film/film.config.json';
const cfg = readJson(cfgPath);
cfg.name = 定稿.title || cfg.name;
cfg.claim = 定稿.claim || cfg.claim;
cfg.width = spec.width;
cfg.height = spec.height;
cfg.fps = spec.fps;
if (定稿.music?.src) cfg.music.src = 定稿.music.src;
if (定稿.music?.volume !== undefined) cfg.music.volume = 定稿.music.volume;
cfg.cover.title = 定稿.cover?.title || 定稿.title || cfg.cover.title;
cfg.cover.accentLine = 定稿.cover?.accentLine || 定稿.claim || cfg.cover.accentLine;
if (定稿.cover?.background) cfg.cover.background = 定稿.cover.background;
if (定稿.cover?.watermark) cfg.cover.watermark = 定稿.cover.watermark;
if (定稿.palette) cfg.palette = {...cfg.palette, ...定稿.palette};
writeJson(cfgPath, cfg);
console.log(`✓ film/film.config.json：「${cfg.name}」${cfg.width}×${cfg.height}@${cfg.fps}`);

if (warnings.length) {
  console.log('');
  for (const w of warnings) console.log(`  ! ${w}`);
}
