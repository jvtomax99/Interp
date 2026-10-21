import './font';
import {Composition} from 'remotion';
import {DURATION, FPS, Promo} from './Promo';

// 720 x 1280 portrait, like media/hub-promo.mp4 (made for phones).
export const Root = () => (
  <Composition id="HubPromo" component={Promo} durationInFrames={DURATION} fps={FPS} width={720} height={1280} />
);
