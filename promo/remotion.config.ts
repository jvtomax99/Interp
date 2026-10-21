import {Config} from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
// Cloud sessions have Chromium preinstalled; elsewhere Remotion fetches its own.
if (process.env.REMOTION_BROWSER) Config.setBrowserExecutable(process.env.REMOTION_BROWSER);
