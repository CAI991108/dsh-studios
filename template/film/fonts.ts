import {useEffect, useState} from 'react';
import {delayRender, continueRender, cancelRender, staticFile} from 'remotion';
import config from './film.config.json';
let ready: Promise<void> | undefined;
export function useFilmFonts() {
  const [handle] = useState(() => delayRender('Loading film font'));
  useEffect(() => {
    if (!ready)
      ready = (async () => {
        if (!config.font.file) return;
        const face = new FontFace(config.font.family, `url(${staticFile(config.font.file)})`, {
          weight: config.font.weight,
          style: 'normal',
        });
        await face.load();
        document.fonts.add(face);
      })();
    ready.then(() => continueRender(handle)).catch(cancelRender);
  }, [handle]);
}
