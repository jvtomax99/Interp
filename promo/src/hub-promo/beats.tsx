// The ten claims. Each gets its own camera move and composition; the
// headline, the dashes and Dr. Smiley's reaction tie them together.
import React from 'react';
import {AbsoluteFill, Img, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Beat, BEAT, BEATS} from './timing';
import {Callout, C, clamp, Dashes, Headline, LightBall, Phone, settle, SHOT_W, SmileyReact, Void} from './kit';
import campus from './campus.json';

const PHONE_W = 700;

// The phone moving through space; the callout lifts off when the ball lands.
const PhoneBeat: React.FC<{b: Beat}> = ({b}) => {
	const frame = useCurrentFrame();
	const {fps, durationInFrames} = useVideoConfig();
	const p = settle(frame, fps, 0, 20);
	const t = frame / durationInFrames;
	const poses = {
		rise: {rx: 38 * (1 - p) + 6, ry: -10 + 8 * t, y: 520 + (1 - p) * 700, x: 150, s: 1},
		tiltL: {rx: 8, ry: 26 * (1 - p) + 14 - 6 * t, y: 560, x: 230 - 60 * p, s: 1},
		tiltR: {rx: 8, ry: -26 * (1 - p) - 14 + 6 * t, y: 560, x: 130 + 40 * p, s: 1},
		dive: {rx: 4, ry: -6, y: 560, x: 155, s: 1 + 0.25 * t},
		pins: {rx: 10, ry: -18, y: 600, x: 300, s: 0.85},
	};
	const pose = poses[b.move as keyof typeof poses] ?? poses.tiltR;
	const land = 12;
	const lift = settle(frame, fps, land, 14);
	const cw = 860;
	return (
		<AbsoluteFill style={{perspective: 2200}}>
			<Phone
				screen={b.screen}
				width={PHONE_W}
				scroll={b.move === 'dive' ? 240 * t : 0}
				glow={b.accent}
				style={{left: pose.x, top: pose.y, transform: `rotateX(${pose.rx}deg) rotateY(${pose.ry}deg) scale(${pose.s})`, transformOrigin: '50% 30%'}}
			/>
			{b.callout ? (
				<>
					<Callout
						screen={b.screen}
						rect={b.callout}
						width={cw}
						glow={b.accent}
						style={{
							left: (1080 - cw) / 2 + 40,
							top: 900 + (1 - lift) * 120,
							opacity: lift,
							transform: `translateZ(${lift * 160}px) rotateX(${(1 - lift) * 25}deg) scale(${0.9 + 0.1 * lift})`,
						}}
					/>
					<LightBall from={[140, 520]} to={[560, 960]} at={0} dur={land} />
				</>
			) : null}
		</AbsoluteFill>
	);
};

// Every specialty pin flying in and settling into a field behind the phone.
const PinField: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	// The 24 specialty pins (pins/; the other 17 are tools).
	const keys = ['cardiology', 'dermatology', 'developmental', 'emergency', 'endocrinology', 'ent', 'genetics', 'heart-failure', 'hematology', 'infectious-disease', 'infusion', 'laboratory',
		'leukemia', 'nephrology', 'neurology', 'oncology', 'ophthalmology', 'orthopedics', 'pediatrics', 'pharmacy', 'pulmonology', 'surgery-anesthesia', 'urology', 'medical-terminology'];
	return (
		<AbsoluteFill style={{perspective: 1800}}>
			{Array.from({length: 40}, (_, i) => {
				const col = i % 5;
				const row = Math.floor(i / 5);
				const p = settle(frame, fps, (i * 3) % 24, 18);
				const x = 40 + col * 200 + (1 - p) * (col - 2) * 300;
				const y = 480 + row * 190 - (1 - p) * 900;
				return (
					<Img
						key={i}
						src={staticFile(`pins/${keys[i % keys.length]}.webp`)}
						style={{position: 'absolute', left: x, top: y, width: 150, opacity: p * 0.9, transform: `translateZ(${-200 + (i % 3) * 120}px) rotate(${(1 - p) * 90}deg)`, filter: i % 3 === 0 ? 'blur(2px)' : undefined}}
					/>
				);
			})}
		</AbsoluteFill>
	);
};

// Daily Drill, Term Review and the Memory trainer fanned out in depth.
const Fan: React.FC<{b: Beat}> = ({b}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const screens = ['memory', 'review', 'drill'];
	return (
		<AbsoluteFill style={{perspective: 2000}}>
			{screens.map((s, i) => {
				const p = settle(frame, fps, i * 5, 18);
				const off = (i - 2) * p;
				return (
					<Phone
						key={s}
						screen={s}
						width={560}
						glow={b.accent}
						style={{left: 250 + off * 190, top: 560 + off * 60, opacity: Math.min(1, p * 1.5), transform: `rotateY(${-22 + off * 6}deg) rotateZ(${off * 4}deg) translateZ(${off * 140}px)`}}
					/>
				);
			})}
		</AbsoluteFill>
	);
};

// 3D Body hero. PLACEHOLDER for the rough cut: three Blender stills of the
// real BodyParts3D meshes (whole, half apart, apart); phase 2 renders the
// animation (promo/blender/body.py --frames) and the heart card.
const BodyHero: React.FC<{b: Beat}> = ({b}) => {
	const frame = useCurrentFrame();
	const {fps, durationInFrames} = useVideoConfig();
	const k = interpolate(frame, [30, 60, 90], [0, 1, 2], clamp);
	const stills = ['still_t0', 'still_t0.5', 'still_t1'];
	const push = interpolate(frame, [0, durationInFrames], [1.0, 1.12]);
	const card = settle(frame, fps, 100, 14);
	return (
		<AbsoluteFill style={{overflow: 'hidden'}}>
			{stills.map((s, i) => (
				<Img
					key={s}
					src={staticFile(`renders/body/${s}.png`)}
					style={{position: 'absolute', width: 1080, top: 380, transform: `scale(${push * 1.25})`, opacity: Math.max(0, 1 - Math.abs(k - i))}}
				/>
			))}
			<Phone
				screen="anatomy"
				width={420}
				glow={b.accent}
				style={{left: 600, top: 1000, opacity: card, transform: `translateY(${(1 - card) * 300}px) rotateY(-16deg)`}}
			/>
			<div style={{position: 'absolute', left: 40, bottom: 40, fontSize: 22, color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace'}}>ROUGH CUT · Blender stills, animation in phase 2</div>
		</AbsoluteFill>
	);
};

// Certification hero: the app's own campus layers (city/), pushed through
// in depth, windows lighting up building by building as the score climbs.
// The layers are 960x760, so full frame is soft; phase 2 re-renders them big.
const CampusHero: React.FC = () => {
	const frame = useCurrentFrame();
	const {durationInFrames} = useVideoConfig();
	const t = frame / durationInFrames;
	const S = 1920 / 760; // cover the frame's height
	const w = 960 * S;
	const left = (1080 - w) / 2 + 160;
	const order = ['t', 'e', 'n', 'c', 's'];
	const score = Math.round(interpolate(frame, [10, durationInFrames - 15], [0, 86], clamp));
	const B = campus as Record<string, {lv: number[][]}>;
	const img = (name: string, r: number[]) => (
		<Img key={name} src={staticFile(`city/${name}.webp`)} style={{position: 'absolute', left: r[0] * S, top: r[1] * S, width: r[2] * S, height: r[3] * S}} />
	);
	return (
		<AbsoluteFill style={{overflow: 'hidden', background: '#2b2350'}}>
			<div style={{position: 'absolute', left: left - t * 40, top: 0, width: w, height: 1920, transform: `scale(${1 + t * 0.04})`}}>{img('sky', [0, 0, 960, 760])}</div>
			<div style={{position: 'absolute', left: left - t * 140, top: 0, width: w, height: 1920, transform: `scale(${1 + t * 0.14})`, transformOrigin: '50% 62%'}}>
				{img('far', [0, 0, 960, 760])}
				{order.map((key, i) => {
					const lvl = Math.round(interpolate(frame, [10 + i * 10, 40 + i * 10], [0, 10], clamp));
					return lvl < 1 ? null : <div key={key} style={{filter: 'drop-shadow(0 0 10px #ffd27a)'}}>{img(`${key}-lit${lvl}`, B[key].lv[lvl - 1])}</div>;
				})}
				{img('near', [0, 0, 960, 760])}
			</div>
			<AbsoluteFill style={{background: 'linear-gradient(to bottom, rgba(6,10,28,0.85) 0%, rgba(6,10,28,0) 30%, rgba(6,10,28,0) 75%, rgba(6,10,28,0.7) 100%)'}} />
			<div style={{position: 'absolute', left: 0, right: 0, top: 1480, textAlign: 'center', fontFamily: 'Inter Variable', color: '#fff'}}>
				<div style={{fontSize: 170, fontWeight: 800, letterSpacing: -6, textShadow: '0 0 40px #ffc857'}}>{score}%</div>
				<div style={{fontSize: 32, letterSpacing: 10, opacity: 0.8}}>READY</div>
			</div>
		</AbsoluteFill>
	);
};

// Ask Dr. Smiley, then his answer feeding the knowledge brain.
// PLACEHOLDER: the brain is its screenshot; phase 2 renders brain/you.html live.
const AskBrain: React.FC<{b: Beat}> = ({b}) => {
	const frame = useCurrentFrame();
	const {durationInFrames} = useVideoConfig();
	const half = Math.round(durationInFrames / 2);
	const dive = interpolate(frame, [half - 10, half + 8], [0, 1], clamp);
	return (
		<AbsoluteFill>
			<AbsoluteFill style={{opacity: 1 - dive, transform: `scale(${1 + dive * 1.6})`}}>
				<PhoneBeat b={b} />
			</AbsoluteFill>
			<AbsoluteFill style={{opacity: dive}}>
				<Img src={staticFile('screens/brain.png')} style={{position: 'absolute', width: 1080 * 1.35, left: -190, top: -300, transform: `scale(${1.25 - 0.25 * dive})`}} />
				<div style={{position: 'absolute', left: 40, bottom: 40, fontSize: 22, color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace'}}>ROUGH CUT · brain screenshot, live 3D in phase 2</div>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};

const OneBeat: React.FC<{b: Beat; i: number}> = ({b, i}) => {
	const frame = useCurrentFrame();
	const {durationInFrames} = useVideoConfig();
	const body =
		b.move === 'body' ? <BodyHero b={b} /> :
		b.move === 'campus' ? <CampusHero /> :
		b.move === 'brain' ? <AskBrain b={b} /> :
		b.move === 'fan' ? <Fan b={b} /> :
		b.move === 'pins' ? (<><PinField /><PhoneBeat b={b} /></>) :
		<PhoneBeat b={b} />;
	return (
		<Void glow={b.accent}>
			{body}
			<AbsoluteFill style={{background: 'linear-gradient(to bottom, rgba(6,10,28,0.85) 0%, rgba(6,10,28,0) 26%)'}} />
			<Dashes count={BEATS.length} index={i} progress={frame / durationInFrames} />
			<Headline line1={b.line1} line2={b.line2} accent={b.accent} />
			<SmileyReact face={b.face} side={i % 2 ? 'right' : 'left'} />
		</Void>
	);
};

export const Beats: React.FC = () => {
	let t = 0;
	return (
		<AbsoluteFill>
			{BEATS.map((b, i) => {
				const from = t;
				t += b.dur;
				return (
					<Sequence key={b.id} from={from} durationInFrames={b.dur} name={b.id}>
						<OneBeat b={b} i={i} />
					</Sequence>
				);
			})}
		</AbsoluteFill>
	);
};

export {BEAT, SHOT_W, C};
