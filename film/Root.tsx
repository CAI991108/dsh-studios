import React from 'react';
import {Composition,Still} from 'remotion';
import {NteFilm,Soundtrack,TOTAL} from './Film';
import {Cover} from './Cover';
export const Root:React.FC=()=> <><Composition id="NteFilm" component={NteFilm} durationInFrames={TOTAL} fps={30} width={1920} height={1080} defaultProps={{bgm:true}}/><Composition id="Soundtrack" component={Soundtrack} durationInFrames={TOTAL} fps={30} width={1920} height={1080} defaultProps={{bgm:true}}/><Still id="Cover" component={Cover} width={1920} height={1080}/></>;
