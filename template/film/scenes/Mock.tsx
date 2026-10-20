import React from 'react';
import {AbsoluteFill} from 'remotion';
import {useCurrentFrame} from 'remotion';
import {C, FONT, MONO, Texture, bounce, tween} from '../style';
import {useFilmFonts} from '../fonts';
import type {SceneProps} from './index';

/** 窗口镜头：把一张截图装进「一台电脑上的窗口」里。屏幕录制类素材的标准容器。
 *  params.src 为空时窗口里放标题，空骨架也能看出构图。 */
export const Mock: React.FC<SceneProps> = ({headline = '', duration, params = {}}) => {
  useFilmFonts();
  const f = useCurrentFrame();
  const {src = '', label = '窗口标题', tilt = 0, x = 140, y = 150, w = 1640, h = 800} = params as Record<string, never>;
  const inT = tween(f, 2, 26, 0, 1, bounce);
  return (
    <AbsoluteFill style={{background: C.base}}>
      <div
        style={{
          position: 'absolute',
          left: Number(x),
          top: Number(y),
          width: Number(w),
          height: Number(h),
          borderRadius: 22,
          overflow: 'hidden',
          border: '1px solid rgba(180,190,254,.2)',
          boxShadow: '0 30px 90px #0008',
          background: C.base,
          opacity: Math.min(inT, tween(f, duration - 8, duration, 1, 0)),
          transform: `perspective(1800px) rotateY(${Number(tilt)}deg) scale(${0.97 + 0.03 * inT})`,
        }}
      >
        <div
          style={{
            height: 44,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '0 18px',
            background: C.surface,
            fontFamily: MONO,
            fontSize: 20,
            color: C.dim,
          }}
        >
          {[C.hot, '#f9e2af', C.third].map((c) => (
            <div key={c} style={{width: 14, height: 14, borderRadius: 7, background: c}} />
          ))}
          <span style={{marginLeft: 12}}>{String(label)}</span>
        </div>
        <div style={{position: 'absolute', top: 44, left: 0, right: 0, bottom: 0, overflow: 'hidden'}}>
          {src ? (
            <Texture name={String(src)} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
          ) : (
            <>
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: FONT,
                  fontSize: 64,
                  fontWeight: 540,
                  color: C.text,
                  whiteSpace: 'pre-line',
                  textAlign: 'center',
                }}
              >
                {String(headline)}
              </div>
              <div
                style={{
                  position: 'absolute',
                  left: 26,
                  bottom: 22,
                  fontFamily: MONO,
                  fontSize: 24,
                  color: C.dim,
                }}
              >
                缺素材 · {String(label)}
              </div>
            </>
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
};
