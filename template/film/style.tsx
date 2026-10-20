// 房子的公用零件：色板、字体、缓动、贴图。scenes/ 只从这里拿，不从 Film.tsx 拿——
// 否则 Film → scenes → Film 会绕成环。
import React from 'react';
import {Easing, Img, interpolate, staticFile} from 'remotion';
import config from './film.config.json';

export const C = config.palette;
export const FONT = `"${config.font.family}",sans-serif`;
export const MONO = '"Cascadia Code",Consolas,monospace';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
export const ease = Easing.bezier(0.16, 1, 0.3, 1);
export const bounce = Easing.bezier(0.34, 1.4, 0.44, 1);

/** 帧 f 在 [a,b] 区间里从 x 走到 y，两端夹住。 */
export const tween = (f: number, a: number, b: number, x = 0, y = 1, e: (t: number) => number = ease) =>
  interpolate(f, [a, b], [x, y], {...clamp, easing: e});

/** public/ 下的图；路径为空时渲染成空，不报错——这样空骨架也能出片。 */
export const Texture: React.FC<{name: string; style?: React.CSSProperties; kind?: 'image' | 'video'}> = ({
  name,
  style,
  kind = 'image',
}) => {
  if (!name) return null;
  if (kind === 'video') return <video src={staticFile(name)} muted style={{objectFit: 'cover', ...style}} />;
  return <Img src={staticFile(name)} style={{display: 'block', ...style}} />;
};

/** 素材缺失时的可见占位：渲染不崩，但一眼看得出缺哪张图。 */
export const Missing: React.FC<{what: string; style?: React.CSSProperties}> = ({what, style}) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: `2px dashed ${C.dim}`,
      color: C.dim,
      fontFamily: MONO,
      fontSize: 28,
      background: 'repeating-linear-gradient(45deg,#181825,#181825 12px,#1e1e2e 12px,#1e1e2e 24px)',
      ...style,
    }}
  >
    缺素材 · {what}
  </div>
);
