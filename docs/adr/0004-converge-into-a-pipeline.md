# 0004 · 把制作流程收敛成一条派生链

日期：2026-10-21
状态：已采纳

## 背景

上一版（`_archive/v1-2026-10-19/`）留下了完整的前半段：`定稿清单.md`、`分幕总览.md`、`分镜脚本.md`、`拍摄提示卡.md`、`制作手册.md`、`GLOSSARY.md`、3 条 ADR、一个能播的 `animatic.html`。交付包留下了完整的后半段：`film/` 的 Remotion 源码、`src/` 的浏览器编辑台、`scripts/launch.cjs` 的启动器、`timing.json` 的单一时间轴。

两半都在，接不上。表现是：下一支片子要重搭一遍机器，因为**唯一的接缝是手写的**。

`film/workbench.ts` 只有 8 行，但它把这支片子的 `SHOTS / CAPTIONS / COPY` 一个个映射成编辑台要的格式；`docs/工作流.md` 的「复用清单」第 3 步只说「重写 `timing.json` 的 `shots`」，一个字没提这一步。缺口正好落在最需要它的地方。

## 决定

### 1. 接缝定为 `WorkbenchManifest`，并把它往前延伸一条派生链

编辑台认可的接口一直是清楚的：`film/workbench.ts` 里 `export const WORKBENCH`，结构与 `src/cards/manifest.ts` 的 `WorkbenchManifest` **兼容即可，不需要 import 对方的类型**。

真正缺的是这个对象**由谁生成**。答案是把链条往前接：

```
定稿.json ──new-film.mjs──▶ film/timing.json ──▶ film/workbench.ts ──▶ 编辑台 / 渲染
（人写）        （派生）        （派生）              （静态，通用）
```

于是「为新片接线」从「手写一遍映射」变成「跑一条命令」。`Film.tsx`、`workbench.ts` 不再随片变化。

### 2. 每支片子一份工程副本，不做共享工作台

上一版的完整形态是「一个通用工作台 + `<工程>/src/workbench.ts` 清单 + 符号链接接入」，`src/proj.d.ts` 里还留着这个设计的注脚。放弃了，理由压过收益：

- Windows 上建符号链接要开发者模式，交付给别人的第一步就断。
- 交付包要能独立解压就跑；共享工作台天然不独立。
- 一份 0.7 MB 的副本，换「解压即用」，值。

代价写在下面。

### 3. 定稿是数据，不是表

`定稿清单.md` 的状态机是上一版最有价值的设计：`已定 / 待改 / 提议 / 待选 / 待定` + 编号 + 「回复方式：编号 + 选择」。它把「对齐剧本」变成一件可执行的事。

但它是 Markdown 表，程序读不稳。改为 `定稿.json`：每拍一条 `beat`，`status` 是字段。状态机的语义原样保留，见 `references/gates.md`——**`已定` 只能由人推上去**。

### 4. `film/` 纳入 typecheck

原 `tsconfig.json` 的 `include` 只有 `["src"]`。也就是说影片源码从来没被类型检查过；`npm run typecheck` 绿不代表片子编得过。改为 `["src", "film"]`，并补上 `resolveJsonModule`。

### 5. 验收门做成脚本，人那半保留清单

`验收记录.md` 的十一条里，能自动判的（时间轴连续、素材存在、凭据与绝对路径泄漏、产物哈希）下沉为 `npm run qa`；只能人判的（逐帧隐私、混音、版权、数据口径）留在 `references/gates.md` 里逐条打勾。自动那半挡住机械错误，人那半挡住判断错误。

## 被否掉的选项

- **共享工作台 + 符号链接**：见决定 2。
- **把 `scenes` 做成配置表（JSON 描述动画）**：会丢掉类型检查与任意动画的能力，而「影片即代码」正是这套东西的立身之本。保留 TSX 注册表，只把**参数**放进定稿的 `params`。
- **用 Markdown 当定稿**：agent 解析不稳，状态机会退化成散文。
- **为某一支片子特化模板**：那就又回到 `film/workbench.ts` 手写的老路。

## 代价

1. **骨架升级要手动合并。** 每支片子是老模板的冻结副本；改进 `template/` 不会回灌到已开的工程。片子做完即归档，这是可接受的；如果要长期维护一支片子，就把它当独立仓库。
2. **`qa.mjs` 会随模板冻结。** 老工程里的验收门不会自动变严。
3. **`Film.tsx` 成了不可改的共享代码。** 想改装配逻辑就是改所有片子。这是有意的约束——装配逻辑本来就该稳定，变化应该落到 `scenes/` 和 `params`。

## 验证

在一个**全新 scaffold**的工程上跑通，而不是在开发目录里：

- `npm run qa` 通过（定稿 3 拍 / 300 帧 / 1 条字幕）
- `npx tsc --noEmit` 通过，`include` 含 `film/`
- `npm run build` 通过，`@proj/workbench` 解析到 `/film/workbench.ts`
- `launch.cjs` 首次启动自动 `npm ci`（262 包）并起服务，`http://127.0.0.1:<port>/?import=project` 返回 200
- `render-film.cjs --check` 出 12 帧
- 工作台按清单导入后渲染的第 45 帧，与影片本体第 45 帧 **sha256 相同**（`d0abf2c1…`）——派生链在真实渲染上闭合
- 原地改定稿（第二拍 120 → 200 帧）后 `npm run derive`，`total` 300 → 380，后续镜头的 `from` 自动重排，`qa` 仍绿
- 把 `status` 改成 `待定`，`qa` 退出码 1 并逐条点名；加 `-- --draft` 则放行
- 有配乐时 `bgm:true` 与 `bgm:false` 两次渲染 sha256 不同（`46091a12…` / `b691cb0c…`），配乐开关真的生效

骨架三镜头的实际出帧留档在 [`docs/pipeline-proof/`](../pipeline-proof/)：`01-title-scene.png`（字卡）、`02-media-scene.png`（素材 + 缺素材占位）、`03-mock-scene.png`（窗口容器）。

## 复盘

三个 bug 冒出来，两个根因相同：

1. `film/style.ts` 里写了 JSX，esbuild 才报「Expected ">"」——因为 `tsconfig` 的 `include` 不含 `film/`，`tsc` 从来没看过它。**类型检查在说谎**，这条修完永久生效（决定 4）。
2. `film/workbench.ts` 从 `./Film` 取 `Scene`，而它实际在 `./scenes`——同一个根因，补上 `include` 后立刻现形。
3. `npm run qa --draft` 的 `--draft` 被 npm 吃掉，必须写 `npm run qa -- --draft`。文档里已按能跑通的形式写。

系统性的一条：**「检查覆盖得到」比「检查很严格」重要。** 一个只检查一半代码的严格检查器，比没有更危险，因为它发绿。下次给任何工程加 gate，先确认它的覆盖面。
