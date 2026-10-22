// The promo, start to finish (docs: promo/README.md). Order and times: timing.ts.
import React from 'react';
import {AbsoluteFill, Audio, getStaticFiles, Img, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {SCENES, starts, TOTAL} from './timing';
import {C, clamp, Phone, SANS, settle} from './kit';
import {Hook, Logo, Opener} from './intro';
import {Beats} from './beats';

// The close: the phone on a reflective floor in front of the campus at
// sunset, the logo on its ring, the closing lines, then the credits.
const Close: React.FC = () => {
	const frame = useCurrentFrame();
	const {fps, durationInFrames} = useVideoConfig();
	const phone = settle(frame, fps, 0, 22);
	const lines = ['Built Here, for Our Patients.', 'Live Today, on Any Phone.', 'Better Words. Safer Care.'];
	const credits = interpolate(frame, [durationInFrames - 40, durationInFrames - 30], [0, 1], clamp);
	return (
		<AbsoluteFill style={{background: C.void, overflow: 'hidden'}}>
			<Img src={staticFile('hero.jpg')} style={{position: 'absolute', height: 1100, left: '50%', top: -40, transform: 'translateX(-50%)', filter: 'brightness(0.55) saturate(1.3) sepia(0.35) hue-rotate(-15deg)'}} />
			<AbsoluteFill style={{background: 'linear-gradient(to bottom, rgba(255,120,60,0.18) 0%, rgba(6,10,28,0.2) 40%, #060A1C 58%)'}} />
			<div style={{position: 'absolute', left: 0, right: 0, top: 1010, height: 910, background: 'linear-gradient(#0b1233, #04060f)'}} />
			<Phone
				screen="home"
				width={430}
				reflect
				glow={C.cyan}
				style={{left: 300, top: 560 + (1 - phone) * 400, transform: `rotateY(${(1 - phone) * -30 - 8}deg)`, opacity: phone}}
			/>
			<div style={{position: 'absolute', left: 0, right: 0, top: 290, textAlign: 'center', fontFamily: SANS, color: '#fff'}}>
				<div style={{fontSize: 92, fontWeight: 800, letterSpacing: -3, opacity: settle(frame, fps, 10, 14), textShadow: `0 0 40px ${C.cyan}`}}>Interpreter Hub</div>
				{lines.map((l, i) => {
					const p = settle(frame, fps, 22 + i * 12, 14);
					const last = i === lines.length - 1;
					return (
						<div key={l} style={{marginTop: last ? 26 : 10, fontSize: last ? 58 : 40, fontWeight: last ? 750 : 550, opacity: p * (1 - credits), transform: `translateY(${(1 - p) * 30}px)`, color: last ? C.cyan : 'rgba(255,255,255,0.9)'}}>
							{l}
						</div>
					);
				})}
			</div>
			<div style={{position: 'absolute', left: 0, right: 0, top: 440, textAlign: 'center', fontFamily: SANS, fontSize: 26, lineHeight: 1.6, color: 'rgba(255,255,255,0.75)', opacity: credits}}>
				Anatomy: BodyParts3D, © DBCLS, CC BY 4.0
				<br />
				Screens shown with made-up data. Never patient information.
			</div>
		</AbsoluteFill>
	);
};

const SCENE_EL = {opener: <Opener />, hook: <Hook />, logo: <Logo />, beats: <Beats />, close: <Close />};

export const HubPromo: React.FC = () => {
	const at = starts();
	// Temporary: the draft's own track (promo/public/music/, not committed)
	// until Jose supplies the final music file.
	const music = getStaticFiles().find((f) => f.name.startsWith('music/'));
	return (
		<AbsoluteFill style={{background: C.void}}>
			{SCENES.map((s) => (
				<Sequence key={s.id} from={at[s.id]} durationInFrames={s.dur} name={s.id}>
					{SCENE_EL[s.id]}
				</Sequence>
			))}
			{music ? <Audio src={music.src} volume={(f) => interpolate(f, [TOTAL - 30, TOTAL], [1, 0], clamp)} /> : null}
		</AbsoluteFill>
	);
};
