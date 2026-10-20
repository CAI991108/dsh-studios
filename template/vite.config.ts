import {defineConfig, type Plugin} from 'vite';
import react from '@vitejs/plugin-react';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {mkdirSync, writeFileSync, existsSync, unlinkSync} from 'node:fs';
import {spawn} from 'node:child_process';
import {randomUUID} from 'node:crypto';

const root=dirname(fileURLToPath(import.meta.url));
type Job={status:'running'|'done'|'error';progress:number;lastLine:string;output:string};
const exportPlugin=():Plugin=>({
 name:'portable-local-export',
 configureServer(server){
  const jobs=new Map<string,Job>();
  server.middlewares.use('/api/export',(req,res)=>{
   const send=(code:number,body:unknown)=>{res.statusCode=code;res.setHeader('Content-Type','application/json; charset=utf-8');res.end(JSON.stringify(body));};
   const origin=req.headers.origin;
   if(origin&&origin!==`http://${req.headers.host}`){send(403,{error:'只接受本地编辑台发起的请求。'});return;}
   const path=(req.url??'/').split('?')[0];
   if(req.method==='POST'&&(path==='/'||path==='')){
    if([...jobs.values()].some(x=>x.status==='running')){send(409,{error:'已有导出正在进行。'});return;}
    let raw='';let tooLarge=false;
    req.on('data',c=>{raw+=c;if(raw.length>5_000_000){tooLarge=true;raw='';}});
    req.on('end',()=>{
     if(tooLarge){send(413,{error:'工程数据过大。'});return;}
     let project:any;
     try{project=JSON.parse(raw).project;if(!project||!Array.isArray(project.tracks)||!(project.width>0)||!(project.height>0))throw Error();}catch{send(400,{error:'工程数据无效，请先导入本片工程。'});return;}
     const id=randomUUID();const stamp=new Date().toISOString().replace(/[:.]/g,'-');
     const slug=String(project.name||'film').replace(/[\\/:*?"<>|\s]+/g,'-').slice(0,48);
     const output=`exports/${slug}-${stamp}.mp4`;
     mkdirSync(join(root,'.cache'),{recursive:true});mkdirSync(join(root,'exports'),{recursive:true});
     const props=join(root,'.cache',`project-${id}.json`);
     writeFileSync(props,JSON.stringify({project,renderExact:true}));
     const job:Job={status:'running',progress:0,lastLine:'准备渲染（首次导出可能需要下载浏览器）',output};jobs.set(id,job);
     const child=spawn(process.execPath,[join(root,'scripts/export-project.cjs'),props,join(root,output)],{cwd:root,windowsHide:true,env:process.env});
     const consume=(buf:Buffer)=>{for(const line of buf.toString().split(/\r?\n/).filter(Boolean)){try{const p=JSON.parse(line);if(typeof p.progress==='number')job.progress=p.progress;if(p.message)job.lastLine=p.message;}catch{job.lastLine=line.slice(0,800);}}};
     child.stdout.on('data',consume);child.stderr.on('data',consume);
     const cleanup=()=>{if(existsSync(props))unlinkSync(props);};
     child.on('error',e=>{job.status='error';job.lastLine=e.message;cleanup();});
     child.on('close',code=>{job.status=code===0?'done':'error';if(code===0){job.progress=1;job.lastLine='已保存到 exports 文件夹';}cleanup();});
     send(200,{id});
    });return;
   }
   const m=/^\/([0-9a-f-]+)(\/reveal)?$/.exec(path);const job=m?jobs.get(m[1]):undefined;
   if(!job){send(404,{error:'没有这个导出任务。'});return;}
   if(req.method==='POST'&&m?.[2]){
    if(job.status!=='done'){send(409,{error:'尚未导出完成。'});return;}
    const output=join(root,job.output);
    const cmd=process.platform==='win32'?'explorer.exe':process.platform==='darwin'?'open':'xdg-open';
    const args=process.platform==='win32'?['/select,',output]:process.platform==='darwin'?['-R',output]:[dirname(output)];
    const child=spawn(cmd,args,{detached:true,stdio:'ignore',windowsHide:true});child.on('error',()=>{});child.unref();send(200,{ok:true,output:job.output});return;
   }
   send(200,job);
  });
 }
});

export default defineConfig({
 plugins:[react(),exportPlugin()],
 server:{host:'127.0.0.1',port:Number(process.env.EDITOR_PORT||5198),strictPort:true,watch:{ignored:['**/.cache/**','**/exports/**']}},
 resolve:{alias:{'@proj':join(root,'film')},dedupe:['react','react-dom','remotion']},
 optimizeDeps:{include:['react','react-dom','remotion','@remotion/motion-blur']},
});
