import React from 'react';
import {AbsoluteFill} from 'remotion';
import {useCurrentFrame} from 'remotion';
import {C, FONT, Missing, Texture, ease, tween} from '../style';
import {useFilmFonts} from '../fonts';
import type {SceneProps} from './index';

/** 素材镜头：public/ 里的图或视频铺满，可压一行标题。params.src 为空时给可见占位。 */
export const Media: React.FC<SceneProps> = ({headline = '', params = {}}) => {
  useFilmFonts();
  const f = useCurrentFrame();
  const {
    src = '',
    kind = 'image',
    label = '',
    headline2 = '',
    push = true,
  } = params as Record<string, never>;

  const zoom = push ? tween(f, 0, 150, 1.06, 1.0) : 1;
  return (
    <AbsoluteFill style={{background: C.base}}>
      {src ? (
        <AbsoluteFill style={{transform: `scale(${zoom})`, transformOrigin: '50% 50%'}}>
          <Texture name={String(src)} kind={kind as 'image' | 'video'} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
        </AbsoluteFill>
      ) : (
        <AbsoluteFill style={{padding: '120px 120px 400px'}}>
          <Missing what={String(label || 'params.src')} style={{width: '100%', height: '100%', borderRadius: 24}} />
        </AbsoluteFill>
      )}
      {headline ? (
        <>
          <AbsoluteFill
            style={{
              background: 'linear-gradient(0deg,rgba(17,17,27,.95),transparent 45%)',
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: 105,
              bottom: 190,
              width: 1500,
              fontFamily: FONT,
              fontSize: 92,
              fontWeight: 540,
              lineHeight: 1.22,
              whiteSpace: 'pre-line',
              color: C.text,
              opacity: tween(f, 12, 34),
              transform: `translateY(${26 * (1 - tween(f, 12, 34, 0, 1, ease))}px)`,
            }}
          >
            {String(headline)}
          </div>
        </>
      ) : null}
      {headline2 ? (
        <div
          style={{
            position: 'absolute',
            left: 108,
            bottom: 120,
            fontFamily: FONT,
            fontSize: 40,
            color: C.dim,
            opacity: tween(f, 26, 46),
          }}
        >
          {String(headline2)}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
