import {Config} from '@remotion/cli/config';
import path from 'node:path';
Config.setVideoImageFormat('jpeg');Config.setJpegQuality(96);Config.setConcurrency(2);Config.setChromiumOpenGlRenderer('angle');Config.setCrf(17);
Config.overrideWebpackConfig(c=>({...c,resolve:{...c.resolve,alias:{...c.resolve?.alias,'@proj':path.resolve('film')}}}));
