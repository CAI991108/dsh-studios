import {useEffect,useState} from 'react';
import {delayRender,continueRender,cancelRender,staticFile} from 'remotion';
let ready:Promise<void>|undefined;
export function useFilmFonts(){
 const [handle]=useState(()=>delayRender('Loading the film MiSans font'));
 useEffect(()=>{
  if(!ready)ready=(async()=>{const face=new FontFace('Nte MiSans',`url(${staticFile('fonts/MiSansVF.ttf')})`,{weight:'150 700',style:'normal'});await face.load();document.fonts.add(face);})();
  ready.then(()=>continueRender(handle)).catch(cancelRender);
 },[handle]);
}
