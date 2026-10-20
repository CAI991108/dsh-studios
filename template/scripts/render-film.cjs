// 出片：不经过编辑台，直接把 film/ 渲染成成片。
//   node scripts/render-film.cjs              出 带配乐版 + 无配乐版 + 封面
//   node scripts/render-film.cjs --check      只渲染前 12 帧，验证管线通不通
//   node scripts/render-film.cjs --only=main  只出其中一项（main / nobgm / cover）
// 编辑台里的「导出成片」走的是另一条路（src/remotion/index.ts），两条都该过。
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
process.env.TEMP = path.join(root, '.cache/tmp');
process.env.TMP = process.env.TEMP;
fs.mkdirSync(process.env.TEMP, {recursive: true});
fs.mkdirSync(path.join(root, 'exports'), {recursive: true});

const {bundle} = require('@remotion/bundler');
const {openBrowser, selectComposition, renderMedia, renderStill} = require('@remotion/renderer');

const progress = (p, message) => console.log(JSON.stringify({progress: p, message}));
const check = process.argv.includes('--check');
const only = (process.argv.find((a) => a.startsWith('--only=')) || '').split('=')[1] || 'all';
const config = JSON.parse(fs.readFileSync(path.join(root, 'film/film.config.json'), 'utf8'));
const slug = String(config.name || 'film').replace(/[\\/:*?"<>|\s]+/g, '-').slice(0, 48);
const wants = (k) => only === 'all' || only === k;

(async () => {
  progress(0, '打包 film/');
  const serveUrl = await bundle({
    entryPoint: path.join(root, 'film/index.ts'),
    publicDir: path.join(root, 'public'),
    outDir: path.join(root, '.cache/film-bundle'),
    webpackOverride: (c) => ({...c, cache: false}),
  });

  const options = {chromiumOptions: {gl: 'angle'}, ...(process.env.REMOTION_BROWSER_EXECUTABLE ? {browserExecutable: process.env.REMOTION_BROWSER_EXECUTABLE} : {})};
  progress(0.02, '准备渲染浏览器（第一次会自动下载）');
  const browser = await openBrowser('chrome', options);

  const render = async (id, out, inputProps, frameRange) => {
    const composition = await selectComposition({serveUrl, id, inputProps, puppeteerInstance: browser, timeoutInMilliseconds: 90000});
    await renderMedia({
      serveUrl,
      composition,
      inputProps,
      codec: 'h264',
      outputLocation: path.join(root, out),
      puppeteerInstance: browser,
      ...options,
      concurrency: 2,
      timeoutInMilliseconds: 90000,
      imageFormat: 'jpeg',
      jpegQuality: 96,
      crf: 17,
      ...(frameRange ? {frameRange} : {}),
      onProgress: (p) => {
        if (p.renderedFrames % 30 === 0 || p.progress === 1)
          progress(0.02 + 0.98 * p.progress, `渲染 ${id} ${p.renderedFrames}/${frameRange ? frameRange[1] - frameRange[0] + 1 : composition.durationInFrames} 帧`);
      },
    });
    progress(1, `已出 ${out}`);
  };

  try {
    if (check) {
      await render('Film', 'exports/_check.mp4', {bgm: true}, [0, 11]);
    } else {
      if (wants('main')) await render('Film', `exports/${slug}.mp4`, {bgm: true});
      if (wants('nobgm')) {
        // 没有配乐时不出一份和主版逐字节相同的「无配乐版」——那只会误导人。
        if (config.music?.src) await render('Film', `exports/${slug}-nobgm.mp4`, {bgm: false});
        else progress(1, '没有配乐文件，跳过无配乐版');
      }
      if (wants('cover')) {
        const composition = await selectComposition({serveUrl, id: 'Cover', inputProps: {}, puppeteerInstance: browser, timeoutInMilliseconds: 90000});
        await renderStill({composition, serveUrl, output: path.join(root, `exports/cover-${slug}.png`), puppeteerInstance: browser, ...options});
        progress(1, '已出封面');
      }
    }
  } finally {
    await browser.close({silent: true});
  }
  progress(1, check ? '管线通了（前 12 帧）' : '出片完成，见 exports/');
})().catch((e) => {
  console.error(e.stack || e.message);
  process.exitCode = 1;
});
