# 字体放这里

`new-film.mjs` 开新片时按这个顺序找字体，找到第一个就复制进片子的 `public/fonts/`：

1. `--fonts=<目录>`
2. 本目录（`assets/fonts/`）
3. 技能目录旁边的 `public/fonts/`（在本仓库里就是这一份）
4. 当前工作目录下的 `public/fonts/`

技能本身不背 20MB 字体。把技能装到别的电脑时，把 `.ttf` 和它的授权文件放进来一次，之后每支新片都能取到。

字体名与文件路径写在每支片子的 `film/film.config.json` 里：

```json
"font": { "family": "Nte MiSans", "file": "fonts/MiSansVF.ttf", "weight": "150 700" }
```

换字体只改这里。授权原文跟着字体一起进 `public/fonts/`，并在片子的 `docs/sources.md` 记一行。
