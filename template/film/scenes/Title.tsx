import React from 'react';
import {AbsoluteFill} from 'remotion';
import {useCurrentFrame} from 'remotion';
import {C, FONT, tween} from '../style';
import {useFilmFonts} from '../fonts';
import type {SceneProps} from './index';

/** 字卡：一句大字。params 可改字号、位置、颜色、强调色。 */
export const Title: React.FC<SceneProps> = ({headline = '', duration, params = {}}) => {
  useFilmFonts();
  const f = useCurrentFrame();
  const {
    size = 112,
    x = 105,
    y = 300,
    width = 1700,
    color = C.text,
    accent = C.accent,
    align = 'left',
  } = params as Record<string, never>;
  const t = tween(f, 4, 26);
  const out = tween(f, duration - 10, duration, 1, 0);
  return (
    <AbsoluteFill style={{background: C.base}}>
      <div
        style={{
          position: 'absolute',
          left: x,
          top: y,
          width,
          fontFamily: FONT,
          fontSize: size,
          fontWeight: 540,
          lineHeight: 1.21,
          letterSpacing: -2,
          whiteSpace: 'pre-line',
          textAlign: align as 'left' | 'center',
          color,
          opacity: Math.min(t, out),
          transform: `translateY(${36 * (1 - t)}px)`,
        }}
      >
        {String(headline)
          .split('\n')
          .map((line, i) => (
            <div key={i} style={{color: i === 0 ? color : accent}}>
              {line}
            </div>
          ))}
      </div>
    </AbsoluteFill>
  );
};
