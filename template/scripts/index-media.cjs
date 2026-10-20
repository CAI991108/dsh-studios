const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),pub=path.join(root,'public');
const items=[];
function walk(dir){for(const name of fs.readdirSync(dir).sort()){const p=path.join(dir,name),s=fs.lstatSync(p);if(s.isSymbolicLink())continue;if(s.isDirectory()){walk(p);continue;}const ext=path.extname(name).toLowerCase();const kind=['.png','.jpg','.jpeg','.webp','.svg'].includes(ext)?'image':['.mp4','.webm'].includes(ext)?'video':['.mp3','.wav','.m4a','.ogg'].includes(ext)?'audio':null;if(kind)items.push({file:path.relative(pub,p).split(path.sep).join('/'),dir:path.relative(pub,dir).split(path.sep).join('/'),name,kind});}}
walk(pub);
fs.writeFileSync(path.join(root,'src/mediaManifest.ts'),'export type MediaItem={file:string;dir:string;name:string;kind:"video"|"image"|"audio"};\nexport const MEDIA_ITEMS:MediaItem[]='+JSON.stringify(items,null,2)+';\nexport type LibAudio={file:string;cat:string;name:string};\nexport const SFX_LIB:LibAudio[]=[];\nexport const BGM_LIB:LibAudio[]=[];\n');
