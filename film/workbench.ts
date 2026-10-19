import {SHOTS,CAPTIONS,SFX,TOTAL,Scene,Caption,Music,NteFilm,COPY,VOICE_COMPENSATION_F,MASTER_GAIN} from './Film';
export const WORKBENCH={
 name:'omarchy-NTE · 生产力，稍后再说',fps:30,width:1920,height:1080,total:TOTAL,background:'#1e1e2e',revision:'friend-editor-v1',
 shots:SHOTS.map(s=>({id:s.id,label:COPY[s.id].replaceAll('\n',' '),from:s.from,duration:s.duration,component:Scene,props:{id:s.id,duration:s.duration,headline:COPY[s.id]},durationProp:'duration',cardId:'scene-'+s.id,cardName:COPY[s.id].replaceAll('\n',' '),schema:[{type:'textarea',key:'headline',label:'标题',default:COPY[s.id]}]})),
 captions:CAPTIONS.map(c=>({id:c.id,label:c.text,from:c.from,duration:c.duration,component:Caption,props:{text:c.text,duration:c.duration,fontSize:60},durationProp:'duration',cardId:'caption',cardName:'旁白字幕',schema:[{type:'textarea',key:'text',label:'字幕',default:''},{type:'number',key:'fontSize',label:'字号',default:60,min:40,max:90,step:1}]})),
 overlays:[{id:'original-score',label:'原创配乐 · 120 BPM',from:0,duration:TOTAL,component:Music}],transitions:[],
 sfx:[...SHOTS.filter(s=>s.src).map(s=>({from:s.from+s.voiceFrom-VOICE_COMPENSATION_F,duration:s.voiceDuration,src:s.src,volume:MASTER_GAIN})),...SFX.map(s=>({from:s.from,duration:s.duration,src:'audio/'+s.src,volume:s.volume}))],bgm:[],order:['captions','overlays','transitions'],original:NteFilm
};
