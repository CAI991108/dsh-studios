import React from 'react';
import {Composition, Still} from 'remotion';
import {Film, Soundtrack, TOTAL, FPS, WIDTH, HEIGHT} from './Film';
import {Cover} from './Cover';

export const Root: React.FC = () => (
  <>
    <Composition
      id="Film"
      component={Film}
      durationInFrames={TOTAL}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
      defaultProps={{bgm: true}}
    />
    <Composition
      id="Soundtrack"
      component={Soundtrack}
      durationInFrames={TOTAL}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
      defaultProps={{bgm: true}}
    />
    <Still id="Cover" component={Cover} width={WIDTH} height={HEIGHT} />
  </>
);
