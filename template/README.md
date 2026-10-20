# 一支片子的工程

这是「大肥鱼影业」骨架生成出来的一支片子。一支片子 = 一个目录，四件事：

| 目录 | 是什么 | 谁改 |
|---|---|---|
| `定稿.json` | 唯一的源头：每一拍、它的状态、它属于哪个镜头类型 | 你和 agent 一起，**只改这里** |
| `film/` | 影片源码。`timing.json` 是唯一时间轴 | `film/scenes/` 由你加镜头类型，其余不要动 |
| `src/` | 编辑台（浏览器里改字、拖时间、导出） | 不动，通用 |
| `public/` | 全部素材 | 你放文件 |

## 常用命令

```sh
npm install        第一次
npm run derive     改完 定稿.json 之后重算时间轴（可反复跑）
npm run qa         验收门：定稿状态 / 时间轴连续 / 素材齐 / 凭据泄漏 / 产物
npm run start      起编辑台（自动开浏览器，端口被占会自己换）
npm run render     出片：带配乐版 + 无配乐版 + 封面
npm run render:check   只渲前 12 帧，30 秒验证管线通不通
npm run film       Remotion Studio 直接看片子（不走编辑台）
npm run studio     Remotion Studio 看工作台的卡片库
```

## 三个地方，别放错

- **想改一句话** → `定稿.json` 的 `caption`，然后 `npm run derive && npm run qa`。别去 `timing.json` 里手动改时间。
- **想加一种镜头** → `film/scenes/` 新建一个 `.tsx`，在 `film/scenes/index.tsx` 的 `SCENES` 里加一行。`Film.tsx` 不用动。
- **想换配色和字体** → `film/film.config.json`。

## 为什么 `timing.json` 不许手改

画面切点、字幕起落、音效钉点、旁白入点全从它派生。改一处，全片跟着对；手动改两处，就开始互相打架。

## 交付前

`npm run qa` 通过只是一半。另一半是人：逐帧看隐私（余额、邮箱、通知、真实姓名）、听一遍混音、核一遍版权与数据口径。`docs/sources.md` 是素材台账，别让它空着。
