// Every time in the promo, in one place, so it can be re-cut to the music.
// 30 fps. The draft's track runs at about 120 BPM, so one beat = 15 frames;
// every cut below lands on a beat.
export const FPS = 30;
export const BEAT = 15;
export const W = 1080;
export const H = 1920;

export type SceneId = 'opener' | 'hook' | 'logo' | 'beats' | 'close';

export const SCENES: {id: SceneId; dur: number}[] = [
	{id: 'opener', dur: 6 * BEAT}, // 3 s
	{id: 'hook', dur: 12 * BEAT}, // 6 s
	{id: 'logo', dur: 4 * BEAT}, // 2 s
	{id: 'beats', dur: 0}, // filled from BEATS below
	{id: 'close', dur: 10 * BEAT}, // 5 s
];

// The ten claims, in the draft's order and words (title case fixed).
export type Move = 'rise' | 'tiltL' | 'tiltR' | 'dive' | 'fan' | 'body' | 'campus' | 'brain' | 'pins';
export type Beat = {
	id: string;
	dur: number;
	line1: string;
	line2: string;
	screen: string; // promo/public/screens/<screen>.png
	move: Move;
	accent: string;
	// Part of the screenshot (px in the 1170x2532 capture) that lifts off as a callout.
	callout?: [number, number, number, number];
	face: string; // Dr. Smiley's expression (DR_FACE_FRAMES in index.html)
};

export const BEATS: Beat[] = [
	{id: 'built', dur: 4 * BEAT, line1: 'Built by Our', line2: 'Own Interpreters.', screen: 'home', move: 'rise', accent: '#01B8E6', callout: [30, 1730, 1110, 290], face: 'wink'},
	{id: 'glossary', dur: 4 * BEAT, line1: 'One Glossary.', line2: 'Every Specialty.', screen: 'domains', move: 'pins', accent: '#2E8BD0', callout: [55, 280, 1060, 290], face: 'smile'},
	{id: 'body', dur: 10 * BEAT, line1: 'Explore the 3D Body.', line2: 'English and Spanish.', screen: 'anatomy', move: 'body', accent: '#FF5A6E', face: 'surprised'},
	{id: 'ai', dur: 4 * BEAT, line1: 'Glossary First.', line2: 'AI Second.', screen: 'search', move: 'dive', accent: '#01B8E6', callout: [55, 785, 1060, 690], face: 'lookUR'},
	{id: 'physician', dur: 4 * BEAT, line1: 'Ready for', line2: 'Every Physician.', screen: 'doctor', move: 'tiltL', accent: '#7C6A9C', callout: [40, 300, 1090, 380], face: 'smile'},
	{id: 'falsefriends', dur: 4 * BEAT, line1: '101 False Friends.', line2: 'Flagged.', screen: 'falsefriends', move: 'tiltR', accent: '#FF3D7F', callout: [45, 690, 1080, 820], face: 'worried'},
	{id: 'drills', dur: 4 * BEAT, line1: 'Daily Drills.', line2: 'Sharp Skills.', screen: 'drill', move: 'fan', accent: '#FFC857', face: 'laugh'},
	{id: 'cert', dur: 8 * BEAT, line1: 'National Certification.', line2: 'Prep Built In.', screen: 'practice', move: 'campus', accent: '#FFC857', face: 'love'},
	{id: 'team', dur: 4 * BEAT, line1: 'One Team.', line2: 'One Channel.', screen: 'chat', move: 'tiltL', accent: '#35A97A', callout: [30, 150, 1110, 330], face: 'smile'},
	{id: 'ask', dur: 8 * BEAT, line1: 'Stuck?', line2: 'Ask Dr. Smiley.', screen: 'ask', move: 'brain', accent: '#01B8E6', callout: [40, 640, 1090, 1160], face: 'laugh'},
];

SCENES.find((s) => s.id === 'beats')!.dur = BEATS.reduce((n, b) => n + b.dur, 0);

export const starts = () => {
	let t = 0;
	const out: Record<SceneId, number> = {} as Record<SceneId, number>;
	for (const s of SCENES) {
		out[s.id] = t;
		t += s.dur;
	}
	return out;
};

export const TOTAL = SCENES.reduce((n, s) => n + s.dur, 0);
