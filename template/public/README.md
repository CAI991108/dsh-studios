# 素材放这里

`public/` 是**唯一**的素材来源。工作台启动时会扫描本目录生成素材面板，所以新增素材后重启编辑台即可看到。

```
public/
├── fonts/     字体（MiSansVF.ttf 已就位，许可证在 licenses/）
├── audio/     旁白（一拍一个文件）、签名音效、配乐
├── textures/  静图：截图、壁纸、字卡导出、logo
└── video/     录屏与动态素材
```

两条规矩：

1. **文件名即引用**。`timing.json` 里写 `textures/hero.png`，就对应 `public/textures/hero.png`。
2. **素材进包，来源进台账**。用的每个字体、音效、配乐，在 `docs/sources.md` 记一行：从哪来、什么授权。交付时这是唯一能自证的东西。
