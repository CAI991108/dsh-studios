// 通用装配。这一份**每支片子都一样**：不要为某一支片改本文件。
// 片子之间的差异只出现在三个地方：
//   1. film.config.json  外观与几何
//   2. timing.json       时间（唯一真相，绝对帧）
//   3. scenes/           镜头类型
import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import config from './film.config.json';
import timingRaw from './timing.json';
import {FONT, tween} from './style';
import {useFilmFonts} from './fonts';
import {Scene} from './scenes';

export type Shot = {
  id: string;
  scene: string;
  from: number;
  duration: number;
  headline?: string;
  params?: Record<string, unknown>;
  voiceFrom?: number;
  voiceDuration?: number;
  src?: string;
};
export type Cap = {id: string; from: number; duration: number; text: string; fontSize?: number};
export type Cue = {from: number; duration?: number; src: string; volume?: number; label?: string};
type Timing = {total: number; shots: Shot[]; captions: Cap[]; sfx?: Cue[]};

const timing = timingRaw as unknown as Timing;

export const FPS = config.fps;
export const WIDTH = config.width;
export const HEIGHT = config.height;
export const TOTAL = timing.total;
export const SHOTS: Shot[] = timing.shots;
export const CAPTIONS: Cap[] = timing.captions;
export const SFX: Cue[] = timing.sfx ?? [];
/** 镜头 id → 屏上标题。工作台用它做片段名。 */
export const COPY: Record<string, string> = Object.fromEntries(
  SHOTS.map((s) => [s.id, (s.headline ?? s.id).replaceAll('\n', ' ')]),
);
export const MASTER_GAIN = Math.pow(10, config.masterGainDb / 20);
export const VOICE_COMPENSATION_F = config.voiceOffsetFrames;

/** 字幕条：全片统一的版式，字号可由每个镜头单独覆盖。 */
export const Caption: React.FC<{text: string; duration: number; fontSize?: number}> = ({
  text,
  duration,
  fontSize = config.caption.fontSize,
}) => {
  useFilmFonts();
  const f = useCurrentFrame();
  return (
    <div
      style={{
        position: 'absolute',
        left: config.caption.side,
        right: config.caption.side,
        bottom: config.caption.bottom,
        display: 'flex',
        justifyContent: 'center',
        fontFamily: FONT,
        opacity: Math.min(tween(f, 0, 3), tween(f, duration - 3, duration, 1, 0)),
      }}
    >
      <div
        style={{
          fontSize,
          lineHeight: 1.25,
          fontWeight: config.font.bodyWeight,
          color: '#f5f5ff',
          padding: '13px 26px 16px',
          borderRadius: 14,
          background: config.caption.scrim,
          boxShadow: '0 6px 24px #0004',
          textAlign: 'center',
          whiteSpace: 'nowrap',
        }}
      >
        {text}
      </div>
    </div>
  );
};

/** 配乐轨：没有配乐文件时静默为空（空骨架也能渲染）。 */
export const Music: React.FC = () => {
  const f = useCurrentFrame();
  if (!config.music.src) return null;
  const vol = tween(f, 0, config.music.fadeInFrames, 0, config.music.volume) *
    tween(f, TOTAL - config.music.fadeOutFrames, TOTAL, 1, 0);
  return <Audio src={staticFile(config.music.src)} volume={MASTER_GAIN * vol} />;
};

/** 声音三层：旁白（按拍切文件）+ 音效 + 配乐。关掉 bgm 就是送审/二剪用的无声版。 */
export const Soundtrack: React.FC<{bgm?: boolean}> = ({bgm = true}) => (
  <>
    {SHOTS.filter((s) => s.src).map((s) => (
      <Sequence
        key={'vo-' + s.id}
        from={s.from + (s.voiceFrom ?? 0) - VOICE_COMPENSATION_F}
        durationInFrames={s.voiceDuration || 1}
        premountFor={30}
      >
        <Audio src={staticFile(s.src!)} volume={MASTER_GAIN} />
      </Sequence>
    ))}
    {SFX.map((s, i) => (
      <Sequence key={'sfx-' + i} from={s.from} durationInFrames={s.duration ?? 90} premountFor={30}>
        <Audio src={staticFile(s.src)} volume={MASTER_GAIN * (s.volume ?? 1)} />
      </Sequence>
    ))}
    {bgm ? <Music /> : null}
  </>
);

/** 全片：镜头 → 字幕 → 声音。画面顺序、层序、钉点全部从 timing.json 派生。 */
export const Film: React.FC<{bgm?: boolean}> = ({bgm = true}) => {
  useFilmFonts();
  return (
    <AbsoluteFill style={{background: config.background}}>
      {SHOTS.map((s) => (
        <Sequence key={s.id} from={s.from} durationInFrames={s.duration} premountFor={30}>
          <Scene id={s.id} scene={s.scene} duration={s.duration} headline={s.headline} params={s.params} />
        </Sequence>
      ))}
      {CAPTIONS.map((c) => (
        <Sequence key={c.id} from={c.from} durationInFrames={c.duration} premountFor={30}>
          <Caption text={c.text} duration={c.duration} fontSize={c.fontSize} />
        </Sequence>
      ))}
      <Soundtrack bgm={bgm} />
    </AbsoluteFill>
  );
};
