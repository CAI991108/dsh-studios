// 工作台接入清单。**本文件是通用的，不要为某支片子改它。**
// 工作台读这个对象，把一支片子拆成 镜头 / 字幕 / 叠加层 / 音效 / 配乐 多轨工程。
// 契约的完整字段见 references/protocol.md（在影业技能包里）。
import React from 'react';
import config from './film.config.json';
import {
  SHOTS,
  CAPTIONS,
  SFX,
  TOTAL,
  FPS,
  WIDTH,
  HEIGHT,
  COPY,
  MASTER_GAIN,
  VOICE_COMPENSATION_F,
  Caption,
  Music,
  Film,
} from './Film';
import {Scene} from './scenes';

/** manifest 的 component 字段是 `ComponentType<Record<string, unknown>>`，
 *  而我们的场景组件要具体 props。这里是唯一的类型转换点。 */
type AnyComp = React.ComponentType<Record<string, unknown>>;
const comp = (c: React.ComponentType<never>): AnyComp => c as unknown as AnyComp;

export const WORKBENCH = {
  name: config.name,
  fps: FPS,
  width: WIDTH,
  height: HEIGHT,
  total: TOTAL,
  background: config.background,
  shots: SHOTS.map((s) => ({
    id: s.id,
    label: COPY[s.id],
    from: s.from,
    duration: s.duration,
    component: comp(Scene as unknown as React.ComponentType<never>),
    props: {id: s.id, scene: s.scene, duration: s.duration, headline: s.headline, params: s.params},
    durationProp: 'duration',
    cardId: 'scene-' + s.scene,
    cardName: '镜头 · ' + s.scene,
    schema: [{type: 'textarea', key: 'headline', label: '标题', default: s.headline ?? ''}],
  })),
  captions: CAPTIONS.map((c) => ({
    id: c.id,
    label: c.text,
    from: c.from,
    duration: c.duration,
    component: comp(Caption as unknown as React.ComponentType<never>),
    props: {text: c.text, duration: c.duration, fontSize: c.fontSize ?? config.caption.fontSize},
    durationProp: 'duration',
    cardId: 'caption',
    cardName: '旁白字幕',
    schema: [
      {type: 'textarea', key: 'text', label: '字幕', default: c.text},
      {type: 'number', key: 'fontSize', label: '字号', default: c.fontSize ?? config.caption.fontSize, min: 30, max: 96, step: 1},
    ],
  })),
  overlays: config.music.src
    ? [{id: 'music', label: '配乐', from: 0, duration: TOTAL, component: comp(Music as unknown as React.ComponentType<never>)}]
    : [],
  transitions: [],
  sfx: [
    ...SHOTS.filter((s) => s.src).map((s) => ({
      from: s.from + (s.voiceFrom ?? 0) - VOICE_COMPENSATION_F,
      duration: s.voiceDuration ?? 90,
      src: s.src as string,
      volume: MASTER_GAIN,
    })),
    ...SFX.map((s) => ({
      from: s.from,
      duration: s.duration ?? 90,
      src: s.src,
      volume: MASTER_GAIN * (s.volume ?? 1),
    })),
  ],
  bgm: [],
  order: ['captions', 'overlays', 'transitions'] as const,
  original: comp(Film as unknown as React.ComponentType<never>),
};
