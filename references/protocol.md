# 数据契约

三份数据，一条单向派生链：

```
定稿.json  ──derive.mjs──▶  film/timing.json  ──Film.tsx──▶  film/workbench.ts  ──▶  编辑台 / 渲染
（人写）                    （生成，唯一时间轴）              （静态，通用）
```

箭头只朝右。右边的东西改了，下一次生成就没了。

派生入口：片子目录里 `npm run derive`。它只重写 `timing.json` 与 `film.config.json`，不碰 `scenes/`、`src/`、`public/`，所以可以反复跑。

## 定稿.json（人写的唯一文件）

```json
{
  "title": "片名",
  "claim": "一句话主张，能当封面字",
  "spec": { "width": 1920, "height": 1080, "fps": 30, "targetSeconds": 120 },
  "beats": [ /* 见下表 */ ],
  "sfx": [{ "at": "hook", "offset": 0, "src": "audio/whoosh.mp3", "volume": 1 }],
  "music": { "src": "audio/bgm.mp3", "volume": 0.24 }
}
```

### beat 字段

| 字段 | 必填 | 含义 |
|---|---|---|
| `id` | ✓ | 唯一。旁白文件名、字幕前缀、音效挂点都用它 |
| `scene` | ✓ | `film/scenes/index.tsx` 里 `SCENES` 的键。没有就渲染成红底告示 |
| `frames` | ✓ | 这一拍多少帧。片长 = 所有 `frames` 之和 |
| `status` | ✓ | `已定` / `提议` / `待改` / `待选` / `待定` |
| `headline` | | 屏上大字，`\n` 分行。会变成编辑台里的片段名 |
| `caption` | | 一条屏幕字幕。也可以写 `captions: []` 分多条 |
| `text` | | 念出来的话。有旁白时才有意义 |
| `params` | | 传给镜头组件的参数，如 `{"src":"textures/a.png"}` |
| `voice` | | 旁白文件，如 `audio/voice-hook.mp3` |
| `voiceFrom` | | 旁白在拍内的入点，缺省 12 帧（0.4 秒呼吸） |
| `voiceFrames` | | 旁白多长。给了 `voice` 就必须给 |
| `act` | | 幕名，只用于人读 |
| `notes` | | 这一拍的规则或退回理由。写在这里的，下次不许又改回去 |

### 派生规则（`npm run derive` 干的事）

- `from` 按 `beats` 顺序累加 `frames`，从 0 开始。**不要手填 `from`。**
- 字幕进点 = 拍首 + 6 帧，出点 = 拍尾 − 6 帧；一拍多条形均分这段窗口。
- `sfx[].at` 是 beat id，`offset` 相对该拍起点。挂到不存在的 id 上会被丢弃并报出来。
- 生成的 `timing.json` 里 `shots[].from` 必须首尾相接，`qa` 会逐段核。

## film/timing.json（生成，唯一时间轴）

```json
{
  "total": 2966,
  "shots": [
    { "id": "hook", "scene": "title", "from": 0, "duration": 135,
      "headline": "为了提高生产力", "params": {},
      "voiceFrom": 12, "voiceDuration": 87, "src": "audio/voice-hook.mp3" }
  ],
  "captions": [{ "id": "hook-1", "from": 24, "duration": 75, "text": "屏幕上的字" }],
  "sfx": [{ "from": 40, "duration": 90, "src": "audio/whoosh.mp3", "volume": 1 }]
}
```

画面切点、字幕起落、音效钉点、旁白入点全部从这里派生。`duration` 用帧。

## film/film.config.json（外观与几何）

`name` / `width` / `height` / `fps` / `background` / `palette` / `font` / `caption` / `music` / `cover`。
换配色、换字体、改字幕字号，都在这里。片子之间唯一的「长相」差异就在这个文件。

## film/workbench.ts（工作台清单）

编辑台靠这份清单把一支片子拆成 镜头 / 字幕 / 叠加层 / 音效 / 配乐 多轨。**它是通用的，不要为某支片子改它**——它只是把 `Film.tsx` 的导出发成组件引用。

契约的关键只有一条：**结构兼容即可**。工程文件不需要 import 工作台的类型，只要 `export const WORKBENCH` 的对象字段对得上：

| 字段 | 含义 |
|---|---|
| `name` `fps` `width` `height` `total` `background` | 成片身份 |
| `shots[]` `transitions[]` `captions[]` `overlays[]` | 单元层：`{id, label, from, duration, component, props, durationProp, schema, cardId}` |
| `sfx[]` `bgm[]` | 音频钉点：`{from, duration, src, volume}` |
| `order` | 层序，缺省 `transitions > captions > overlays` |
| `original` | 原成片整条合成，供逐帧对照 |

`from` / `duration` 一律**绝对帧**，与 `Film.tsx` 里的 `<Sequence from durationInFrames>` 一一对应。`cardId` 相同的单元在素材库里共用一张卡（例如所有 `title` 镜头共用「镜头 · title」）。

## film/scenes/index.tsx（镜头注册表）

```ts
export const SCENES: Record<string, React.FC<SceneProps>> = { title: Title, media: Media, mock: Mock };
```

`SceneProps = { id, duration, headline?, params? }`。加一种镜头 = 加一个 `.tsx` + 在 `SCENES` 里加一行。没有其它注册步骤，也没有别的文件要改。

未注册的 `scene` 渲染成红底告示而不是崩掉整条片子——这样 `render:check` 还能跑完，`qa` 会把它当错误拦下。
