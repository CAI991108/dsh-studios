import React from 'react';
import {AbsoluteFill} from 'remotion';
import config from './film.config.json';
import {C, FONT, Texture} from './style';
import {useFilmFonts} from './fonts';

/** 封面：一张静帧。文案与底图都在 film.config.json 的 cover 段里改。 */
export const Cover: React.FC = () => {
  useFilmFonts();
  const {title, accentLine, background, watermark} = config.cover;
  return (
    <AbsoluteFill style={{background: config.background, fontFamily: FONT}}>
      {background ? (
        <Texture name={background} style={{position: 'absolute', width: '100%', height: '100%', objectFit: 'cover'}} />
      ) : null}
      <AbsoluteFill
        style={{background: 'linear-gradient(90deg,rgba(17,17,27,.95),rgba(17,17,27,.42) 50%,transparent 80%)'}}
      />
      <div
        style={{
          position: 'absolute',
          left: 110,
          top: 300,
          width: 1200,
          fontSize: 128,
          lineHeight: 1.23,
          fontWeight: config.font.titleWeight,
          letterSpacing: -3,
          color: C.text,
          whiteSpace: 'pre-line',
        }}
      >
        {title}
        {accentLine ? (
          <>
            <br />
            <span style={{color: C.hot}}>{accentLine}</span>
          </>
        ) : null}
      </div>
      {watermark ? (
        <Texture
          name={watermark}
          style={{position: 'absolute', right: 150, bottom: 80, width: 310, objectFit: 'contain', imageRendering: 'pixelated'}}
        />
      ) : null}
    </AbsoluteFill>
  );
};
