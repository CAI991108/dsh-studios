const fs=require('node:fs'),path=require('node:path'),net=require('node:net');
const {spawn,spawnSync}=require('node:child_process');
const {createHash}=require('node:crypto');
const root=path.resolve(__dirname,'..');process.chdir(root);
require('./index-media.cjs');
const cache=path.join(root,'.cache');fs.mkdirSync(path.join(cache,'tmp'),{recursive:true});
Object.assign(process.env,{TEMP:path.join(cache,'tmp'),TMP:path.join(cache,'tmp'),npm_config_cache:path.join(cache,'npm'),GOMAXPROCS:'2',GOMEMLIMIT:'256MiB'});
if(Number(process.versions.node.split('.')[0])<22){console.error('需要 Node.js 22 或更高版本。请从 https://nodejs.org 安装 LTS 后重试。');process.exit(1);}
const hash=createHash('sha256').update(fs.readFileSync('package-lock.json')).update(`${process.platform}/${process.arch}/${process.versions.node.split('.')[0]}`).digest('hex');
const marker=path.join(cache,'installed.json');
let installed;try{installed=JSON.parse(fs.readFileSync(marker,'utf8')).hash;}catch{}
if(!fs.existsSync('node_modules/vite/bin/vite.js')||installed!==hash){
 console.log('首次启动：安装编辑台依赖，需要联网，请等待。');
 const r=spawnSync(process.platform==='win32'?'npm.cmd':'npm',['ci','--no-audit','--no-fund','--registry=https://registry.npmjs.org'],{cwd:root,stdio:'inherit',shell:process.platform==='win32',env:process.env});
 if(r.status!==0){console.error('依赖安装失败，请检查网络，然后重新运行启动脚本。');process.exit(r.status||1);}
 fs.writeFileSync(marker,JSON.stringify({hash}));
}
const requested=process.argv.find(x=>x.startsWith('--port='));
const freePort=p=>new Promise(resolve=>{const s=net.createServer();s.once('error',()=>resolve(false));s.listen(p,'127.0.0.1',()=>s.close(()=>resolve(true)));});
(async()=>{
 let port=requested?Number(requested.split('=')[1]):5198;
 if(!Number.isInteger(port)||port<1024||port>65515)throw Error('端口参数无效。');
 for(let n=0;n<20;n++,port++){if(await freePort(port))break;if(n===19)throw Error('没有可用的本地端口。');}
 process.env.EDITOR_PORT=String(port);
 const url=`http://127.0.0.1:${port}/?import=project`;
 console.log(`\n编辑台地址：${url}\n保存工程：编辑台顶部“导出JSON”。成片输出：exports 文件夹。\n保持此窗口打开，按 Ctrl+C 停止。\n`);
 const child=spawn(process.execPath,['--max-old-space-size=1536',path.join(root,'node_modules/vite/bin/vite.js'),'--host','127.0.0.1','--port',String(port),'--strictPort'],{cwd:root,stdio:'inherit',env:process.env});
 const open=()=>{if(process.argv.includes('--no-open'))return;const cmd=process.platform==='win32'?'explorer.exe':process.platform==='darwin'?'open':'xdg-open';const p=spawn(cmd,[url],{detached:true,stdio:'ignore',windowsHide:true});p.on('error',()=>{});p.unref();};
 const started=Date.now();const timer=setInterval(async()=>{try{const r=await fetch(url);if(r.ok){clearInterval(timer);open();}}catch{}if(Date.now()-started>60000)clearInterval(timer);},500);
 child.on('exit',code=>{clearInterval(timer);process.exitCode=code||0;});
 process.on('SIGINT',()=>{clearInterval(timer);child.kill('SIGINT');});
})().catch(e=>{console.error(e.message);process.exitCode=1;});
