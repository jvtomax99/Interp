// Opener (the campus), the wrong-word hook, the logo build.
import React from 'react';
import {AbsoluteFill, Img, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {BEAT} from './timing';
import {C, clamp, SANS, settle, Void} from './kit';

// 0-3 s: the campus photo, a slow push, the plaque settling in.
// Phase 2: cut the photo into 2-3 depth layers for real parallax.
export const Opener: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps, durationInFrames} = useVideoConfig();
	const push = interpolate(frame, [0, durationInFrames], [1.18, 1.32]);
	const p = settle(frame, fps, 12, 20);
	const out = interpolate(frame, [durationInFrames - 6, durationInFrames], [0, 1], clamp);
	return (
		<AbsoluteFill style={{background: C.void, overflow: 'hidden'}}>
			<Img src={staticFile('hero.jpg')} style={{position: 'absolute', height: '100%', left: '50%', transform: `translateX(-50%) scale(${push})`, transformOrigin: '30% 70%', filter: `brightness(${1 - out * 0.8})`}} />
			<AbsoluteFill style={{background: 'linear-gradient(to bottom, rgba(6,10,28,0.0) 40%, rgba(6,10,28,0.75) 100%)'}} />
			<div
				style={{
					position: 'absolute',
					left: 90,
					right: 90,
					bottom: 520,
					padding: '34px 40px',
					borderRadius: 28,
					background: 'rgba(60,40,30,0.55)',
					backdropFilter: 'blur(18px)',
					border: '1px solid rgba(255,255,255,0.25)',
					fontFamily: SANS,
					color: '#fff',
					textAlign: 'center',
					opacity: p,
					transform: `translateY(${(1 - p) * 80}px) rotateX(${(1 - p) * 30}deg)`,
				}}
			>
				<div style={{fontSize: 62, fontWeight: 750, letterSpacing: -1.5}}>Hackensack</div>
				<div style={{fontSize: 34, fontWeight: 550, opacity: 0.9}}>University Medical Center</div>
				<div style={{height: 4, width: 120 * p, background: C.cyan, margin: '18px auto 0', borderRadius: 2}} />
			</div>
		</AbsoluteFill>
	);
};

// A big word punching in from depth, with a small spaced label above it.
const Punch: React.FC<{label: string; word: string; color: string; glow: string; size?: number; strike?: number; tag?: string; tagAt?: number}> = ({
	label,
	word,
	color,
	glow,
	size = 150,
	strike,
	tag,
	tagAt = 0,
}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const p = settle(frame, fps, 0, 10);
	const s = strike === undefined ? 0 : interpolate(frame, [strike, strike + 8], [0, 1], clamp);
	const t = tag ? settle(frame, fps, tagAt, 10) : 0;
	const flicker = color === C.neon ? 0.94 + 0.06 * Math.sin(frame * 1.7) * Math.sin(frame * 0.6) : 1;
	return (
		<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', fontFamily: SANS, perspective: 1400}}>
			<div style={{position: 'absolute', top: 760, fontSize: 30, letterSpacing: 14, color: 'rgba(255,255,255,0.7)', fontWeight: 550, opacity: p}}>{label}</div>
			<div
				style={{
					position: 'relative',
					fontSize: size,
					fontWeight: 800,
					letterSpacing: -4,
					lineHeight: 1,
					textAlign: 'center',
					color,
					opacity: p * flicker,
					transform: `translateZ(${(1 - p) * 600}px)`,
					filter: `blur(${(1 - p) * 18}px)`,
					textShadow: `0 0 18px ${glow}, 0 0 60px ${glow}, 0 0 120px ${glow}88`,
					padding: '0 60px',
					whiteSpace: 'pre-line',
				}}
			>
				{word}
				{strike !== undefined ? (
					<div style={{position: 'absolute', left: 50, top: '52%', height: 12, width: `calc(${s * 100}% - 100px)`, background: color, boxShadow: `0 0 30px ${glow}`, borderRadius: 6}} />
				) : null}
			</div>
			{tag ? (
				<div style={{position: 'absolute', top: 1260, padding: '14px 34px', borderRadius: 40, background: C.neon, color: '#fff', fontSize: 40, fontWeight: 700, opacity: t, transform: `translateY(${(1 - t) * 40}px) rotate(-3deg)`, boxShadow: `0 0 40px ${C.neon}`}}>
					{tag}
				</div>
			) : null}
		</AbsoluteFill>
	);
};

// Huge faint words drifting behind, the way the draft fills the frame.
const Backdrop: React.FC<{text: string; tint: string}> = ({text, tint}) => {
	const frame = useCurrentFrame();
	return (
		<AbsoluteFill style={{overflow: 'hidden', fontFamily: SANS}}>
			{Array.from({length: 7}, (_, i) => (
				<div
					key={i}
					style={{
						position: 'absolute',
						top: i * 290 - 60,
						left: (i % 2 ? -1 : 1) * (frame * 6) - 600,
						whiteSpace: 'nowrap',
						fontSize: 260,
						fontWeight: 850,
						letterSpacing: -8,
						color: tint,
						opacity: 0.1,
					}}
				>
					{`${text} · ${text} · ${text} · ${text}`}
				</div>
			))}
		</AbsoluteFill>
	);
};

// 3-9 s. The draft's "TO FIND THE WORD 0.31s" card is cut: nothing measures it.
export const Hook: React.FC = () => (
	<AbsoluteFill>
		<Sequence durationInFrames={3 * BEAT}>
			<Void glow={C.accent2}>
				<Backdrop text="HEART FAILURE" tint="#9fb4ff" />
				<Punch label="THE DOCTOR" word="Heart Failure" color="#fff" glow="#8fb0ff" />
			</Void>
		</Sequence>
		<Sequence from={3 * BEAT} durationInFrames={5 * BEAT}>
			<AbsoluteFill style={{background: 'radial-gradient(120% 70% at 50% 55%, #4a0c3a 0%, #1a0726 50%, #07040f 100%)'}}>
				<Backdrop text="¿FALLO CARDÍACO?" tint="#ff6fa0" />
				<Punch label="THE INTERPRETER" word="¿Fallo Cardíaco?" color={C.neon} glow={C.neon} size={130} strike={BEAT * 2} tag="Close. Not the standard." tagAt={BEAT * 3} />
			</AbsoluteFill>
		</Sequence>
		<Sequence from={8 * BEAT} durationInFrames={4 * BEAT}>
			<Void glow={C.cyan}>
				<Backdrop text="INSUFICIENCIA CARDÍACA" tint="#7fe3ff" />
				<Punch label="THE RIGHT WORD" word={'Insuficiencia\nCardíaca'} color="#E9FBFF" glow={C.cyan} size={128} />
			</Void>
		</Sequence>
	</AbsoluteFill>
);

// 9-11 s: glowing cubes fall into a holographic ring and become the mark.
export const Logo: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const cubes = Array.from({length: 18}, (_, i) => {
		const a = (i / 18) * Math.PI * 2;
		const delay = (i * 7) % 14;
		const p = settle(frame, fps, delay, 16);
		const x = Math.cos(a) * 120 * (1 - p * 0.6);
		const y = -900 * (1 - p) + Math.sin(a) * 40;
		return {x, y, p, i};
	});
	const ring = settle(frame, fps, 10, 20);
	const mark = settle(frame, fps, 30, 16);
	return (
		<Void glow={C.cyan}>
			<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', perspective: 1600}}>
				<div style={{position: 'absolute', top: 1120, width: 620, height: 170, borderRadius: '50%', border: `6px solid ${C.cyan}`, boxShadow: `0 0 60px ${C.cyan}, inset 0 0 60px ${C.cyan}88`, opacity: ring, transform: `scale(${0.6 + ring * 0.4})`}} />
				<div style={{position: 'absolute', top: 1180, width: 520, height: 300, background: `radial-gradient(50% 50% at 50% 0%, ${C.cyan}66, transparent)`, opacity: ring}} />
				{cubes.map((c) => (
					<div
						key={c.i}
						style={{
							position: 'absolute',
							left: 540 + c.x - 22,
							top: 1100 + c.y - 22,
							width: 44,
							height: 44,
							borderRadius: 8,
							background: c.i % 3 === 0 ? C.navy : c.i % 3 === 1 ? C.accent2 : C.cyan,
							boxShadow: `0 0 24px ${C.cyan}`,
							opacity: 1 - mark,
							transform: `rotate(${(1 - c.p) * 220}deg)`,
						}}
					/>
				))}
				<Img src={staticFile('icon-512.png')} style={{position: 'absolute', top: 760, width: 360, borderRadius: 80, opacity: mark, transform: `translateY(${(1 - mark) * 60}px) scale(${0.8 + mark * 0.2})`, boxShadow: `0 0 80px ${C.cyan}aa`}} />
				<div style={{position: 'absolute', top: 1360, fontFamily: SANS, fontSize: 64, fontWeight: 750, color: '#fff', letterSpacing: -1.5, opacity: mark}}>Interpreter Hub</div>
			</AbsoluteFill>
		</Void>
	);
};
