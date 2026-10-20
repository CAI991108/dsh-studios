// 镜头注册表：定稿里每个 beat 的 `scene` 字段就是这个对象的键。
// 加一种新镜头 = 在这里加一行 + 新建一个 .tsx。Film.tsx 和 timing.json 都不用动。
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {MONO} from '../style';
import {Title} from './Title';
import {Media} from './Media';
import {Mock} from './Mock';

export type SceneProps = {
  id: string;
  duration: number;
  headline?: string;
  params?: Record<string, unknown>;
};

export const SCENES: Record<string, React.FC<SceneProps>> = {
  title: Title,
  media: Media,
  mock: Mock,
};

export const SCENE_NAMES = Object.keys(SCENES);

/** 未注册的 scene：渲染成红色告示，而不是让整条片子崩掉。
 *  出片前 `npm run qa` 会把这种情况当错误拦下。 */
const Unknown: React.FC<{id: string; scene: string}> = ({id, scene}) => (
  <AbsoluteFill
    style={{
      background: '#3a1220',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: MONO,
      fontSize: 52,
      color: '#ffb4c0',
      gap: 18,
    }}
  >
    <div>场景未注册 · {scene}</div>
    <div style={{fontSize: 30, color: '#ff8fa3'}}>
      镜头 {id} · 已注册：{SCENE_NAMES.join(' / ')}
    </div>
  </AbsoluteFill>
);

export const Scene: React.FC<SceneProps & {scene: string}> = ({scene, ...rest}) => {
  const Comp = SCENES[scene];
  if (!Comp) return <Unknown id={rest.id} scene={scene} />;
  return <Comp {...rest} />;
};
