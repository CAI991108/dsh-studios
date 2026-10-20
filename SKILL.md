---
name: dsh-studios
description: 视频生产线（大肥鱼影业 / dsh-Studios）：把一句话主张收敛成定稿，从定稿派生出可渲染的影片工程，起本地编辑台改片，出片并过验收。做新片、把定稿转成工程、给现有片子改文案或加镜头、起编辑台、出片验收时用。
---

# 大肥鱼影业 · dsh-Studios

一支片子 = 一个目录 = 一份**定稿**派生出的三条下游：时间轴 `film/timing.json`、工作台清单 `film/workbench.ts`、镜头实现 `film/scenes/`。

改片子只有一条路径：**改 `定稿.json`，重跑派生**。下游手改一处，全片的时间码就开始互相打架，而且没人知道哪个是对的。

## 什么时候不用这套

30 秒以内、一次性成片、3–5 个镜头：直接 ffmpeg 拼。这套流程的判据只有一个——**会不会改第二遍**。会，就上；一次成型，就别上。

## 开局

先把工程立起来，再往里面灌内容。空工程能装、能起、能出 12 帧，这三件事在第一步就该成立。

```sh
node <仓库目录>/scripts/new-film.mjs <新片目录> --from=<定稿.json>
cd <新片目录> && npm install
```

没有现成定稿就跳过 `--from`，它带一份三镜头的空骨架，之后在原地改 `定稿.json`。骨架不带字体（19MB），脚本会从 `<仓库目录>/assets/fonts`、`--fonts=` 或当前目录的 `public/fonts` 里取一份。

然后向人要三样东西，缺一样都别往下走：

1. **一句话主张** —— 能直接当封面字，不用再解释。
2. **时长与规格** —— 例：120 秒 / 1920×1080 / 30fps。
3. **交付对象** —— 只发平台？还是连工程一起给对方改？

**完成标准**：`npm run qa` 通过，`npm run start` 能起编辑台，`npm run render:check` 能出 12 帧。

## 接手一支已有的片子

已经有 `定稿.json` 和 `film/` 的工程不用开局。直接改定稿：`npm run derive` → `npm run qa`。只有缺镜头类型时才进第四步。

## 一 · 本子

`定稿.json` 的 `beats` 是唯一的写作界面。每拍一条，字段见 [`references/protocol.md`](references/protocol.md)。

- `frames` 用帧，不用秒——秒会在累加里漂。
- `scene` 只填 `film/scenes/index.tsx` 里注册过的名字，写之前先看一眼 `SCENES` 有什么。
- `caption` 是屏幕上的字，`text` 是念出来的话，两者可以不一样：字幕去掉语气词、改标点。
- 拍数 12–18。超过 18 拍，两分钟里讲不完。

**完成标准**：`npm run qa -- --draft` 全绿——每拍都有 `id` / `scene` / `frames`，时间轴能连成一整条。

## 二 · 声音

先出声，再锁帧。旁白一拍拍一个文件，文件名 = 拍 id（`audio/voice-hook.mp3`），念错一条只重录一条。

拿到音频后，把**真实帧数**回填到 `定稿.json` 的 `voiceFrames` 和 `frames`，然后

```sh
npm run derive
```

片长由旁白决定，不是反过来。

音效三层分开做：旁白、签名音效（全片复用同一套）、配乐（另存一条无 BGM 的）。素材进 `public/`，来源进 `docs/sources.md`。

**完成标准**：`npm run qa` 里「素材缺文件」一条不剩——每一拍的 `voice`、每条音效、配乐，都能在 `public/` 里指到真文件。

## 三 · 定稿门

这是这套流程里唯一必须人点头的地方，也是它和「让 AI 随便做一条」的分界。

逐条把 `status` 推到 `已定`，规则见 [`references/gates.md`](references/gates.md)。`待改` / `提议` / `待选` / `待定` 都算没过门。

**完成标准**：`npm run qa` 通过，且 `定稿.json` 里没有一条 `status` 不是 `已定`。

## 四 · 装配

镜头类型不够用时，在 `film/scenes/` 加一个 `.tsx`，到 `film/scenes/index.tsx` 的 `SCENES` 里加一行。`Film.tsx`、`timing.json`、`workbench.ts` 都不用动。

一拍的画面参数写在 `定稿.json` 的 `params` 里（底图、标题位置、推镜幅度）。能在 `params` 里表达的，就不要新开镜头类型。

**完成标准**：`npm run qa` 不报「scene 没注册」；`npm run render:check` 出 12 帧，画面里有内容而不是红底告示。

## 五 · 监看与改稿

```sh
npm run start
```

浏览器里改字、拖片段、调时长。改动有两个去处，别混：

- **要留存的结构性改动**（片长、字幕文案、加减镜头）→ 回到 `定稿.json`，`npm run derive` 重算，再 `npm run qa`。
- **一次性试** → 编辑台里直接试，导出 JSON 存档，不回流。

**完成标准**：编辑台里能改通一条字幕并看到实时预览。

## 六 · 出片与验收

```sh
npm run render    # 带配乐版 + 无配乐版 + 封面
npm run qa        # 类型 / 定稿 / 时间轴 / 素材 / 泄漏 / 产物
```

`npm run qa` 只判能自动判的那半。另一半必须人过：逐帧看隐私（余额、邮箱、通知、真实姓名）、听一遍混音、核一遍版权与数据口径。清单见 [`references/gates.md`](references/gates.md)。

**完成标准**：`exports/` 里有成片与封面，`npm run qa` 通过，`docs/sources.md` 里每一行外部素材都有来源与授权。

## 交付

```
定稿.json     片子的话和它的状态，别人接手先看这个
film/         影片源码 + timing.json（唯一时间轴）+ scenes/
src/          编辑台
public/       全部素材
docs/sources.md 素材台账
exports/      成片、无配乐版、封面
```

**完成标准**：一个不懂 Remotion 的人，双击启动器就能改字并导出。

## 三条硬规矩

1. **时间是唯一的。** 改时间改 `定稿.json`，重跑派生。`timing.json` 里手改的值，下一次派生就没了。
2. **没过定稿门不出片。** `待定` 的拍留在 `定稿.json` 里可以，但它不许进入渲染。
3. **素材进包，来源进台账。** 来源写不到可逐条反查的，就不用。

三条都是为了让「改第二遍」这件事不疼。
