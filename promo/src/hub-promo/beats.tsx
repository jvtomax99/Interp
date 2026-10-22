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

const pad = (n: number) => String(n).padStart(4, '0');

// Soft bloom: the frame again, blurred and added on top (screen blend).
const Glow: React.FC<{src: string; blur: number; amount: number; style?: React.CSSProperties}> = ({src, blur, amount, style}) => (
	<>
		<Img src={src} style={{position: 'absolute', ...style}} />
		<Img src={src} style={{position: 'absolute', ...style, filter: `blur(${blur}px)`, mixBlendMode: 'screen', opacity: amount}} />
	</>
);

// 3D Body hero: the app's own BodyParts3D meshes rendered in Blender
// (promo/blender/body.py, 150 frames): the body turns, its systems fan out,
// the heart flies to the lens. Then the app's real card for it.
const HEART_CARD: [number, number, number, number] = [30, 1625, 1115, 445]; // names, speakers, description
const BodyHero: React.FC<{b: Beat}> = ({b}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const card = settle(frame, fps, 104, 14);
	const n = Math.min(149, frame);
	// the ES speaker answers: a ring pulsing out from it
	const ring = interpolate((frame - 122) % 24, [0, 24], [0, 1], clamp);
	const cw = 900;
	const k = cw / HEART_CARD[2];
	return (
		<AbsoluteFill style={{overflow: 'hidden'}}>
			<Glow src={staticFile(`renders/body/seq/body_${pad(n)}.png`)} blur={14} amount={0.45} style={{left: 0, top: 0, width: 1080, height: 1920}} />
			<Callout
				screen="heart"
				rect={HEART_CARD}
				width={cw}
				glow={b.accent}
				style={{left: 90, top: 1180 + (1 - card) * 160, opacity: card, transform: `perspective(1600px) rotateX(${(1 - card) * 20}deg)`}}
			/>
			{frame > 122 ? (
				<div
					style={{
						position: 'absolute',
						// the ES button sits at (419, 1844) in the 1170x2532 capture
						left: 90 + (419 - HEART_CARD[0]) * k - 70,
						top: 1180 + (1844 - HEART_CARD[1]) * k - 70,
						width: 140,
						height: 140,
						borderRadius: 70,
						border: `4px solid ${b.accent}`,
						opacity: 1 - ring,
						transform: `scale(${0.5 + ring})`,
					}}
				/>
			) : null}
		</AbsoluteFill>
	);
};

// Certification hero: the app's own 3D campus (docs/mockups/cchi-city/
// entrance.html) flown through frame by frame (promo/capture/campus.cjs),
// windows lighting up building by building as the score climbs.
const CampusHero: React.FC = () => {
	const frame = useCurrentFrame();
	const {durationInFrames} = useVideoConfig();
	const n = Math.min(119, frame);
	const score = Math.round(interpolate(frame, [10, durationInFrames - 15], [0, 86], clamp));
	return (
		<AbsoluteFill style={{overflow: 'hidden', background: '#2b2350'}}>
			<Glow src={staticFile(`renders/campus/campus_${pad(n)}.jpg`)} blur={10} amount={0.25} style={{left: 0, top: 0, width: 1080, height: 1920}} />
			<AbsoluteFill style={{background: 'linear-gradient(to bottom, rgba(6,10,28,0.85) 0%, rgba(6,10,28,0) 30%, rgba(6,10,28,0) 72%, rgba(6,10,28,0.75) 100%)'}} />
			<div style={{position: 'absolute', left: 0, right: 0, top: 1480, textAlign: 'center', fontFamily: 'Inter Variable', color: '#fff'}}>
				<div style={{fontSize: 170, fontWeight: 800, letterSpacing: -6, textShadow: '0 0 40px #ffc857'}}>{score}%</div>
				<div style={{fontSize: 32, letterSpacing: 10, opacity: 0.8}}>READY</div>
			</div>
		</AbsoluteFill>
	);
};

// Ask Dr. Smiley, then his answer flies into the knowledge brain (the live
// brain/you.html, captured frame by frame by promo/capture/brain.cjs): the
// brain turning, then lit with the heart terms, "Heart failure" labelled.
const AskBrain: React.FC<{b: Beat}> = ({b}) => {
	const frame = useCurrentFrame();
	const ASK = 48; // frames on the answer
	const LIT = ASK + 26; // the cut to the lit brain, on a beat
	const out = interpolate(frame, [ASK - 8, ASK + 4], [0, 1], clamp);
	const flash = interpolate(frame, [LIT - 3, LIT, LIT + 10], [0, 1, 0], clamp);
	const brainIn = interpolate(frame, [ASK - 4, ASK + 8], [0, 1], clamp);
	const calm = Math.min(39, Math.max(0, frame - ASK + 6));
	const lit = Math.min(49, Math.max(0, frame - LIT));
	const src = frame < LIT ? staticFile(`renders/brain/calm_${pad(calm)}.png`) : staticFile(`renders/brain/lit_${pad(lit)}.png`);
	return (
		<AbsoluteFill>
			{frame < ASK + 6 ? (
				<AbsoluteFill style={{opacity: 1 - out, transform: `scale(${1 - out * 0.5}) translateY(${-out * 300}px)`}}>
					<PhoneBeat b={b} />
				</AbsoluteFill>
			) : null}
			<LightBall from={[540, 1100]} to={[540, 900]} at={ASK - 8} dur={12} />
			<AbsoluteFill
				style={{
					opacity: brainIn,
					// once lit, a slow push in on "Heart failure" (about 45%, 60% of the frame)
					transform: `scale(${1.25 - 0.2 * brainIn + (frame >= LIT ? 0.35 * settle(frame, 30, LIT, 40) : 0)})`,
					transformOrigin: '45% 60%',
				}}
			>
				<Glow src={src} blur={frame >= LIT ? 16 : 10} amount={frame >= LIT ? 1 : 0.9} style={{left: 0, top: 160, width: 1080, height: 1920}} />
			</AbsoluteFill>
			<AbsoluteFill style={{background: '#bfefff', opacity: flash * 0.5, mixBlendMode: 'screen'}} />
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
