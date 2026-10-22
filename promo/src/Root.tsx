import {Composition} from 'remotion';
import {HubTitle} from './HubTitle';
import {HubPromo} from './hub-promo/HubPromo';
import {FPS, H, TOTAL, W} from './hub-promo/timing';

// HubTitle: 720p at 30 fps, the same frame as media/hub-promo.mp4.
// HubPromo: the vertical remake of Jose's draft (README, "The promo remake").
export const Root = () => (
	<>
		<Composition id="HubTitle" component={HubTitle} durationInFrames={90} fps={30} width={1280} height={720} />
		<Composition id="HubPromo" component={HubPromo} durationInFrames={TOTAL} fps={FPS} width={W} height={H} />
	</>
);
