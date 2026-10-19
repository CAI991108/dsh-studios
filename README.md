# 大肥鱼影业

一支 2 分 03 秒的影片，加一台可以继续剪它的编辑台。

题材是 `omarchy-NTE`：Arch + Hyprland 的桌面美化，配一套 DeepSeek Harness（「蓝色大肥鱼」）的像素皮肤。成片在 `original/`，工程在 `film/`，素材在 `public/`。

## 快速开始

1. 装 **Node.js 22+**
2. 双击 **启动编辑台.cmd**（macOS/Linux 用 `sh start-editor.sh`）
3. 第一次会联网装依赖；之后打开浏览器编辑台

命令行也行：`npm start` / `npm run studio` / `npm run build`。

## 目录

| 路径 | 是什么 |
|---|---|
| `original/` | 成片（1080p30）、封面、中英字幕、发布文案 —— 交付物 |
| `film/` | Remotion 源码 + `timing.json`（唯一时间轴） |
| `public/` | 素材：录屏、配音、音效、配乐、字体 |
| `src/` | 编辑台（浏览器里改字、调时间、导出） |
| `docs/` | 制作规格、独立复核、素材来源、验收记录 |
| `licenses/` | 字体与音效的授权原文 |
| `_archive/` | 上一版方案（2026-10-19 之前），只读参考 |

## 文档

- [docs/方法论.md](docs/方法论.md) —— 这支片子为什么成立
- [docs/工作流.md](docs/工作流.md) —— 下一支片子照这个走
- [docs/production-spec.md](docs/production-spec.md) —— 本片的制作规格
- [先看这里.md](先看这里.md) —— 编辑台使用说明（codex 原版）

## 一条规矩

`timing.json` 是唯一时间轴。画面、字幕、音效、旁白全部从它派生——改时间只改一处，别在别处硬编码。
