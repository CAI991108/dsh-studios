const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
process.env.TEMP=path.join(root,'.cache/tmp');process.env.TMP=process.env.TEMP;
fs.mkdirSync(process.env.TEMP,{recursive:true});
const {bundle}=require('@remotion/bundler');
const {openBrowser,selectComposition,renderMedia}=require('@remotion/renderer');
const progress=(p,message)=>console.log(JSON.stringify({progress:p,message}));
(async()=>{
 const propsPath=process.argv[2];
 if(!propsPath)throw Error('请在编辑台中点击“导出成片”，或传入导出的工程JSON路径。');
 const raw=JSON.parse(fs.readFileSync(propsPath,'utf8').replace(/^\uFEFF/,''));
 const inputProps={project:raw.project||raw,renderExact:true};
 const output=process.argv[3]||path.join(root,'exports','edited-film.mp4');
 fs.mkdirSync(path.dirname(output),{recursive:true});
 progress(0,'打包当前工程');
 const serveUrl=await bundle({entryPoint:path.join(root,'src/remotion/index.ts'),publicDir:path.join(root,'public'),outDir:path.join(root,'.cache/render-bundle'),webpackOverride:c=>({...c,cache:false,resolve:{...c.resolve,alias:{...c.resolve?.alias,'@proj':path.join(root,'film')}}})});
 const options={chromiumOptions:{gl:'angle'},...(process.env.REMOTION_BROWSER_EXECUTABLE?{browserExecutable:process.env.REMOTION_BROWSER_EXECUTABLE}:{})};
 progress(.02,'准备渲染浏览器（第一次会自动下载）');
 const browser=await openBrowser('chrome',options);
 try{
  const composition=await selectComposition({serveUrl,id:'Main',inputProps,puppeteerInstance:browser,timeoutInMilliseconds:90000});
  const testRange=process.env.EDITOR_VERIFY_FRAME_RANGE?.split(',').map(Number);
  await renderMedia({serveUrl,composition,inputProps,codec:'h264',outputLocation:output,puppeteerInstance:browser,...options,concurrency:2,timeoutInMilliseconds:90000,imageFormat:'jpeg',jpegQuality:96,crf:17,...(testRange?{frameRange:testRange}:{}),onProgress:p=>{if(p.renderedFrames%30===0||p.progress===1)progress(.02+.98*p.progress,`渲染 ${p.renderedFrames}/${testRange?testRange[1]-testRange[0]+1:composition.durationInFrames} 帧`);}});
  progress(1,'导出完成');
 }finally{await browser.close({silent:true});}
})().catch(e=>{console.error(e.stack||e.message);process.exitCode=1;});
