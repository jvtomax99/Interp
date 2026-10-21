import {Composition} from 'remotion';
import {HubTitle} from './HubTitle';

// 720p at 30 fps, the same frame as media/hub-promo.mp4.
export const Root = () => (
  <Composition id="HubTitle" component={HubTitle} durationInFrames={90} fps={30} width={1280} height={720} />
);
