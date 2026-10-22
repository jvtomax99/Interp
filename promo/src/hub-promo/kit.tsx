// Shared pieces: colours, type, the no-bounce spring, the phone, the
// headline, Dr. Smiley, the ball of light, the progress dashes.
import React from 'react';
import {AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import '@fontsource-variable/inter';
import '@fontsource/ibm-plex-serif/400-italic.css';

// The app's tokens (CLAUDE.md, "Measured tokens").
export const C = {
	void: '#060A1C',
	deep: '#0B1233',
	navy: '#252E6D',
	accent: '#0F5FA6',
	accent2: '#2E8BD0',
	cyan: '#01B8E6',
	neon: '#FF3D7F',
	white: '#FFFFFF',
	ink: '#151C2C',
};
export const SANS = "'Inter Variable', Inter, system-ui, sans-serif";
export const SERIF = "'IBM Plex Serif', serif";

// A plain spring that settles without overshoot (Apple's bounce 0).
export const settle = (frame: number, fps: number, delay = 0, durationInFrames = 18) =>
	spring({frame: frame - delay, fps, durationInFrames, config: {damping: 200, mass: 1, stiffness: 120}});

export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

// Dark navy void with a soft glow behind the subject.
export const Void: React.FC<{glow?: string; children?: React.ReactNode}> = ({glow = C.accent2, children}) => (
	<AbsoluteFill style={{background: `radial-gradient(120% 70% at 50% 58%, ${glow}33 0%, ${C.deep} 45%, ${C.void} 100%)`}}>
		{children}
	</AbsoluteFill>
);

// The screenshots are 390x844 css px at 3x.
export const SHOT_W = 1170;
export const SHOT_H = 2532;

type PhoneProps = {
	screen: string;
	width?: number;
	scroll?: number; // px of the screenshot scrolled up
	style?: React.CSSProperties;
	glow?: string;
	reflect?: boolean;
};
// A phone: thin dark bezel, rounded glass, the real screen inside.
export const Phone: React.FC<PhoneProps> = ({screen, width = 760, scroll = 0, style, glow = C.cyan, reflect}) => {
	const k = width / SHOT_W;
	const h = Math.round(width * (SHOT_H / SHOT_W));
	const bez = Math.round(width * 0.035);
	const body = (
		<div
			style={{
				width: width + bez * 2,
				height: h + bez * 2,
				borderRadius: width * 0.14,
				padding: bez,
				background: 'linear-gradient(145deg,#2a3150,#0d1124 60%,#20263f)',
				boxShadow: `0 0 0 2px #3a4266, 0 40px 120px -20px ${glow}55, 0 20px 60px rgba(4,8,30,0.8)`,
			}}
		>
			<div style={{width, height: h, borderRadius: width * 0.115, overflow: 'hidden', position: 'relative', background: '#F4F6FA'}}>
				<Img src={staticFile(`screens/${screen}.png`)} style={{width, position: 'absolute', top: -scroll * k, left: 0}} />
				<div style={{position: 'absolute', inset: 0, background: 'linear-gradient(115deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0) 32%)'}} />
			</div>
		</div>
	);
	return (
		<div style={{position: 'absolute', transformStyle: 'preserve-3d', ...style}}>
			{body}
			{reflect ? (
				<div style={{transform: 'scaleY(-1)', marginTop: 8, opacity: 0.22, WebkitMaskImage: 'linear-gradient(to top, black 0%, transparent 35%)'}}>{body}</div>
			) : null}
		</div>
	);
};

// One region of a screenshot, lifted off the screen as a card.
export const Callout: React.FC<{screen: string; rect: [number, number, number, number]; width: number; glow: string; style?: React.CSSProperties}> = ({
	screen,
	rect,
	width,
	glow,
	style,
}) => {
	const [x, y, w, h] = rect;
	const k = width / w;
	return (
		<div
			style={{
				position: 'absolute',
				width,
				height: h * k,
				borderRadius: 28,
				overflow: 'hidden',
				boxShadow: `0 0 0 3px ${glow}, 0 0 60px ${glow}aa, 0 30px 80px rgba(4,8,30,0.7)`,
				...style,
			}}
		>
			<Img src={staticFile(`screens/${screen}.png`)} style={{position: 'absolute', width: SHOT_W * k, left: -x * k, top: -y * k}} />
		</div>
	);
};

// The two-line headline: white bold, then a line on a highlight block.
export const Headline: React.FC<{line1: string; line2: string; accent?: string; at?: number}> = ({line1, line2, accent = C.cyan, at = 0}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const a = settle(frame, fps, at, 14);
	const b = settle(frame, fps, at + 5, 14);
	const block = interpolate(b, [0, 1], [0, 100]);
	return (
		<div style={{position: 'absolute', left: 70, top: 250, fontFamily: SANS, color: C.white}}>
			<div style={{fontSize: 74, fontWeight: 750, letterSpacing: -2.2, lineHeight: 1.05, opacity: a, transform: `translateY(${(1 - a) * 40}px)`, filter: `blur(${(1 - a) * 12}px)`}}>
				{line1}
			</div>
			<div style={{position: 'relative', display: 'inline-block', marginTop: 14, padding: '4px 18px 8px', fontSize: 74, fontWeight: 750, letterSpacing: -2.2, lineHeight: 1.05}}>
				<div style={{position: 'absolute', inset: 0, background: accent, borderRadius: 8, clipPath: `inset(0 ${100 - block}% 0 0)`, boxShadow: `0 0 40px ${accent}88`}} />
				<span style={{position: 'relative', color: C.ink, opacity: b}}>{line2}</span>
			</div>
		</div>
	);
};

// Segmented progress along the top, one dash per claim.
export const Dashes: React.FC<{count: number; index: number; progress: number}> = ({count, index, progress}) => (
	<div style={{position: 'absolute', left: 70, right: 70, top: 200, display: 'flex', gap: 12}}>
		{Array.from({length: count}, (_, i) => (
			<div key={i} style={{flex: 1, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.22)', overflow: 'hidden'}}>
				<div style={{height: '100%', width: `${i < index ? 100 : i === index ? progress * 100 : 0}%`, background: C.white}} />
			</div>
		))}
	</div>
);

// Dr. Smiley from the app's own layers (drSmileyArt in index.html): his
// head, a face frame cut from the strip, his brows.
const FACES = ['rest', 'blink1', 'blink2', 'shut', 'wink1', 'wink2', 'wink', 'smile1', 'smile2', 'smile', 'laugh1', 'laugh2', 'laugh', 'laughB', 'lookL', 'lookR', 'love', 'sleep',
	'halfL', 'halfR', 'lookU', 'lookD', 'lookUL', 'lookUR', 'lookDL', 'lookDR', 'surprised', 'sad', 'worried', 'doubt'];
export const Smiley: React.FC<{face: string; size: number; style?: React.CSSProperties}> = ({face, size, style}) => {
	const k = size / 112; // his viewBox is 112 units wide
	const fi = Math.max(0, FACES.indexOf(face));
	const fw = 66.692 * k;
	const fh = 49.025 * k;
	return (
		<div style={{position: 'absolute', width: size, height: size, overflow: 'hidden', ...style}}>
			<div style={{position: 'absolute', left: -4 * k, top: -4 * k}}>
				<Img src={staticFile('drsmiley/base.webp')} style={{position: 'absolute', left: 14 * k, top: 0.8 * k, width: 106 * k, height: 132.5 * k}} />
				<div style={{position: 'absolute', left: 31.667 * k, top: 47.617 * k, width: fw, height: fh, overflow: 'hidden'}}>
					<Img src={staticFile('drsmiley/face.webp')} style={{position: 'absolute', left: -fi * fw, top: 0, width: fw * FACES.length, height: fh}} />
				</div>
				<Img src={staticFile('drsmiley/brow-l.webp')} style={{position: 'absolute', left: 33.875 * k, top: 39.446 * k, width: 28.708 * k, height: 14.354 * k}} />
				<Img src={staticFile('drsmiley/brow-r.webp')} style={{position: 'absolute', left: 73.625 * k, top: 42.758 * k, width: 27.604 * k, height: 19.875 * k}} />
			</div>
		</div>
	);
};

// He pops up from the bottom corner, holds a reaction, blinks.
export const SmileyReact: React.FC<{face: string; side?: 'left' | 'right'; at?: number}> = ({face, side = 'left', at = 6}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const p = settle(frame, fps, at, 16);
	const t = frame - at;
	const now = t < 4 ? 'rest' : t < 7 ? (face.startsWith('smile') || face.startsWith('laugh') || face === 'love' ? 'smile1' : face) : face;
	const blink = t > 30 && t % 40 < 3 ? 'blink2' : now;
	const size = 400;
	return (
		<Smiley
			face={blink}
			size={size}
			style={{bottom: -20 - (1 - p) * size, [side]: 30, transform: `rotate(${(side === 'left' ? -1 : 1) * (1 - p) * 8}deg)`, filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.5))'}}
		/>
	);
};

// The navy ball of light from the app's name animation: a glowing dot that
// travels along a path and flares when it lands.
export const LightBall: React.FC<{from: [number, number]; to: [number, number]; at: number; dur?: number}> = ({from, to, at, dur = 12}) => {
	const frame = useCurrentFrame();
	const t = interpolate(frame, [at, at + dur], [0, 1], clamp);
	const e = 1 - Math.pow(1 - t, 3);
	const x = from[0] + (to[0] - from[0]) * e;
	const y = from[1] + (to[1] - from[1]) * e - Math.sin(e * Math.PI) * 180;
	const flare = interpolate(frame, [at + dur, at + dur + 4, at + dur + 16], [0, 1, 0], clamp);
	const gone = frame > at + dur + 16 || frame < at;
	if (gone) return null;
	return (
		<>
			<div style={{position: 'absolute', left: x - 22, top: y - 22, width: 44, height: 44, borderRadius: 22, background: 'radial-gradient(circle, #fff 0%, #8fd8ff 30%, #2E8BD0 60%, transparent 72%)', boxShadow: '0 0 40px 12px #2E8BD0aa', opacity: 1 - flare * 0.6}} />
			<div style={{position: 'absolute', left: to[0] - 160, top: to[1] - 160, width: 320, height: 320, borderRadius: 160, background: 'radial-gradient(circle, #ffffffcc 0%, #01B8E655 35%, transparent 70%)', opacity: flare, transform: `scale(${0.4 + flare})`}} />
		</>
	);
};
