import {AbsoluteFill, Audio, Easing, Img, interpolate, random, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {INTER} from './font';
import {DrSmiley, Face} from './DrSmiley';

/* The Hub in 45 seconds (media/hub-promo.mp4). Its cuts sit where the
   soundtrack's do (taken from the earlier cut of the video): the hook to
   10.73 s, nine 3-second screens to 36.67 s, then the campus. */
export const FPS = 30;
export const DURATION = 1353; // 45.1 s, the length of the soundtrack
const s = (sec: number) => Math.round(sec * FPS);

const NAVY = '#16205A', INK = '#0B1240', CYAN = '#01B8E6', CORAL = '#FF5A6E';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ease = Easing.bezier(0.2, 0.8, 0.2, 1);

const fadeUp = (frame: number, at: number, fps: number, dist = 40) => {
  const p = spring({frame: frame - at, fps, config: {damping: 200}});
  return {opacity: interpolate(frame - at, [0, 8], [0, 1], clamp), transform: `translateY(${(1 - p) * dist}px)`};
};

/* ---------- The backdrop: navy glow, drifting squares, giant outlined words ---------- */
const Squares = ({count = 22, seed = 'sq'}: {count?: number; seed?: string}) => {
  const frame = useCurrentFrame();
  return (
    <>
      {Array.from({length: count}, (_, i) => {
        const x = random(`${seed}x${i}`) * 720, y0 = random(`${seed}y${i}`) * 1280;
        const size = 10 + random(`${seed}s${i}`) * 26, speed = 0.15 + random(`${seed}v${i}`) * 0.5;
        const y = ((y0 - frame * speed) % 1340 + 1340) % 1340 - 30;
        const rot = random(`${seed}r${i}`) * 90 + frame * (random(`${seed}w${i}`) - 0.5);
        const a = 0.25 + random(`${seed}a${i}`) * 0.55;
        return <div key={i} style={{position: 'absolute', left: x, top: y, width: size, height: size, transform: `rotate(${rot}deg)`,
          background: i % 3 ? '#2E8BD0' : CYAN, opacity: a, borderRadius: 3}} />;
      })}
    </>
  );
};

const GiantWords = ({words}: {words: string[]}) => {
  const frame = useCurrentFrame();
  return (
    <>
      {words.map((w, i) => (
        <div key={i} style={{position: 'absolute', top: 120 + i * 330, left: 0, whiteSpace: 'nowrap', fontFamily: INTER, fontWeight: 700,
          fontSize: 150, letterSpacing: -3, color: 'transparent', WebkitTextStroke: '2px rgba(140,170,255,.13)',
          transform: `translateX(${(i % 2 ? -600 : -200) + (i % 2 ? 1 : -1) * frame * 1.2}px)`}}>
          {`${w} · ${w} · ${w} · ${w}`}
        </div>
      ))}
    </>
  );
};

const Backdrop = () => (
  <AbsoluteFill style={{background: `radial-gradient(120% 80% at 70% 20%, #2B3FA0 0%, ${NAVY} 45%, ${INK} 100%)`}}>
    <GiantWords words={['HEART FAILURE', 'MEDICAL CENTER', 'INSUFICIENCIA', 'UNIVERSITY']} />
    <Squares />
  </AbsoluteFill>
);

const Kicker = ({children, color}: {children: React.ReactNode; color: string}) => (
  <div style={{fontSize: 22, fontWeight: 650, letterSpacing: 5, color, textTransform: 'uppercase', marginBottom: 18}}>{children}</div>
);
const Big = ({children, size = 92, style}: {children: React.ReactNode; size?: number; style?: React.CSSProperties}) => (
  <div style={{fontSize: size, fontWeight: 700, lineHeight: 1.02, letterSpacing: -2.5, color: '#fff', ...style}}>{children}</div>
);

/* ---------- The hook: the doctor's words, the clock, the wrong word, the right one ---------- */
const DoctorSays = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const jargon = [['ejection fraction', 150, 860], ['beta-blocker', 360, 1010], ['echo', 470, 760], ['diuretic', 90, 1130]] as const;
  return (
    <AbsoluteFill style={{padding: '0 60px', justifyContent: 'center'}}>
      <div style={fadeUp(frame, 4, fps)}><Big size={100}>The doctor<br />says:</Big></div>
      {jargon.map(([w, x, y], i) => (
        <div key={w} style={{position: 'absolute', left: x, top: y - frame * 0.6, fontSize: 34, fontWeight: 550, color: 'rgba(200,215,255,.45)',
          transform: `rotate(${(i % 2 ? -1 : 1) * 4}deg)`, opacity: interpolate(frame, [10 + i * 8, 24 + i * 8], [0, 1], clamp)}}>{w}</div>
      ))}
    </AbsoluteFill>
  );
};

const Clock = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = interpolate(frame, [18, 70], [0, 0.31], {...clamp, easing: Easing.out(Easing.cubic)});
  return (
    <AbsoluteFill style={{padding: '0 60px', justifyContent: 'center'}}>
      <div style={{position: 'absolute', top: 200, left: 60, ...fadeUp(frame, 0, fps, 20)}}><Big size={68}>Heart<br />failure</Big></div>
      <div style={fadeUp(frame, 12, fps)}>
        <Kicker color="rgba(220,230,255,.75)">To find the word</Kicker>
        <div style={{fontSize: 190, fontWeight: 700, letterSpacing: -8, color: '#fff', fontVariantNumeric: 'tabular-nums'}}>{t.toFixed(2)}s</div>
        <div style={{marginTop: 26, height: 8, borderRadius: 4, background: 'rgba(255,255,255,.18)', width: 560}}>
          <div style={{height: 8, borderRadius: 4, background: CYAN, width: (t / 0.31) * 330}} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

const WrongWord = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const strike = interpolate(frame, [16, 26], [0, 1], {...clamp, easing: ease});
  const pill = spring({frame: frame - 26, fps, config: {damping: 11, stiffness: 160}});
  return (
    <AbsoluteFill style={{padding: '0 60px', justifyContent: 'center'}}>
      <div style={{position: 'absolute', top: 200, left: 60, opacity: 0.5, filter: 'blur(1.5px)'}}><Big size={68}>Heart<br />failure</Big></div>
      <div style={fadeUp(frame, 0, fps)}>
        <Kicker color={CORAL}>The interpreter</Kicker>
        <div style={{position: 'relative', display: 'inline-block'}}>
          <Big size={110} style={{opacity: 1 - strike * 0.45}}>¿Fallo<br />cardíaco?</Big>
          {[0.3, 0.8].map((y) => (
            <div key={y} style={{position: 'absolute', left: -8, top: `${y * 100}%`, height: 9, borderRadius: 5, background: CORAL, width: `${strike * 104}%`}} />
          ))}
        </div>
      </div>
      <div style={{position: 'absolute', left: 300, top: 900, transform: `scale(${pill}) rotate(-5deg)`, background: CORAL, color: '#fff',
        fontSize: 40, fontWeight: 650, padding: '14px 30px', borderRadius: 40, boxShadow: '0 12px 30px -10px rgba(255,90,110,.6)'}}>Not for patients.</div>
    </AbsoluteFill>
  );
};

const RightWord = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const bar = interpolate(frame, [10, 30], [0, 1], {...clamp, easing: ease});
  return (
    <AbsoluteFill style={{padding: '0 60px', justifyContent: 'center'}}>
      <div style={fadeUp(frame, 0, fps)}>
        <Kicker color={CYAN}>The right word</Kicker>
        <Big size={104}>Insuficiencia<br />cardíaca</Big>
        <div style={{marginTop: 26, height: 9, borderRadius: 5, background: CYAN, width: bar * 420, boxShadow: `0 0 24px ${CYAN}`}} />
      </div>
    </AbsoluteFill>
  );
};

const LogoBurst = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const p = spring({frame, fps, config: {damping: 14, stiffness: 120}});
  const colors = [CYAN, '#2E8BD0', '#FF9F43', '#FF5A9E', '#F7C948', '#3B5BDB'];
  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
      {Array.from({length: 12}, (_, i) => {
        const a = (i / 12) * Math.PI * 2, r = 70 + p * 120 + frame * 0.6;
        return <div key={i} style={{position: 'absolute', left: 360 + Math.cos(a) * r - 11, top: 520 + Math.sin(a) * r - 11, width: 22, height: 22,
          background: colors[i % colors.length], transform: `rotate(${45 + frame * 2}deg) scale(${p})`, borderRadius: 3, opacity: interpolate(frame, [20, 37], [1, 0.5], clamp)}} />;
      })}
      <div style={{position: 'absolute', top: 430, left: 270, width: 180, height: 180, borderRadius: 90, background: '#fff', transform: `scale(${p})`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 20px 50px -20px rgba(0,0,0,.6)'}}>
        <Img src={staticFile('art/hmh-mark-square.png')} style={{width: 120}} />
      </div>
      <div style={{position: 'absolute', top: 660, width: '100%', textAlign: 'center', ...fadeUp(frame, 6, fps, 24)}}>
        <Big size={78} style={{letterSpacing: -2}}>Interpreter Hub</Big>
        <div style={{fontSize: 30, color: 'rgba(220,230,255,.8)', marginTop: 14, fontWeight: 550}}>for the HUMC interpreter team</div>
      </div>
    </AbsoluteFill>
  );
};

/* ---------- The nine screens ---------- */
type Screen = {shot: string; line: string; pill: string; color: string; ink?: string; focus?: [number, number, number, number]};
const SCREENS: Screen[] = [
  {shot: 'home', line: 'Built by our', pill: 'own interpreters.', color: CORAL, focus: [0.02, 0.755, 0.96, 0.125]},
  {shot: 'glossary', line: 'One glossary.', pill: 'Every specialty.', color: '#F7C948', ink: INK},
  {shot: 'translate', line: 'Glossary first.', pill: 'AI second.', color: '#2ED47A', ink: INK, focus: [0.02, 0.6, 0.96, 0.33]},
  {shot: 'doctor', line: 'Ready for', pill: 'every physician.', color: '#FF5A9E'},
  {shot: 'falsefriends', line: '101 false friends.', pill: 'Flagged.', color: '#8B7CFF'},
  {shot: 'drill', line: 'Daily drills.', pill: 'Sharp skills.', color: '#FF9F43', ink: INK},
  {shot: 'practice', line: 'National certification.', pill: 'Prep built in.', color: '#4FC3F7', ink: INK},
  {shot: 'chat', line: 'One team.', pill: 'One channel.', color: '#B6E34A', ink: INK},
  {shot: 'ask', line: 'Stuck?', pill: 'Ask Dr. Smiley.', color: CYAN, ink: INK},
];
const SCREEN_LEN = 90; // 3 s each

const Phone = ({shot, focus}: {shot: string; focus?: Screen['focus']}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const enter = spring({frame, fps, config: {damping: 18, stiffness: 110}});
  const W = 510, H = W * (759 / 393);
  const drift = interpolate(frame, [0, SCREEN_LEN], [0, -18]);
  const tilt = interpolate(frame, [0, SCREEN_LEN], [-2.5, 1.5]);
  const glow = interpolate(frame, [26, 36], [0, 1], clamp);
  return (
    <div style={{position: 'absolute', left: (720 - W) / 2, top: 286 + (1 - enter) * 900 + drift, width: W, height: H,
      transform: `rotate(${tilt}deg)`, borderRadius: 58, padding: 12, background: '#0A0F2C',
      boxShadow: '0 0 0 2px rgba(160,180,255,.25), 0 40px 80px -30px rgba(0,0,0,.8)'}}>
      <div style={{position: 'relative', width: '100%', height: '100%', borderRadius: 46, overflow: 'hidden', background: '#F4F6FA'}}>
        <Img src={staticFile(`shots/${shot}.jpg`)} style={{width: '100%', display: 'block'}} />
        {focus && (
          <div style={{position: 'absolute', left: `${focus[0] * 100}%`, top: `${focus[1] * 100}%`, width: `${focus[2] * 100}%`, height: `${focus[3] * 100}%`,
            border: `4px solid ${CORAL}`, borderRadius: 22, opacity: glow, transform: `scale(${1.08 - glow * 0.08})`, boxShadow: `0 0 0 9999px rgba(10,15,44,${glow * 0.25})`}} />
        )}
      </div>
    </div>
  );
};

const ScreenScene = ({s: sc}: {s: Screen}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const wipe = interpolate(frame, [8, 20], [0, 1], {...clamp, easing: ease});
  return (
    <AbsoluteFill>
      <Phone shot={sc.shot} focus={sc.focus} />
      <div style={{position: 'absolute', top: 92, left: 52, right: 40}}>
        <div style={fadeUp(frame, 0, fps, 24)}><Big size={54} style={{letterSpacing: -1.5}}>{sc.line}</Big></div>
        <div style={{display: 'inline-block', marginTop: 12, position: 'relative', padding: '4px 18px 8px', ...fadeUp(frame, 6, fps, 18)}}>
          <div style={{position: 'absolute', inset: 0, background: sc.color, borderRadius: 14, transformOrigin: 'left', transform: `scaleX(${wipe})`}} />
          <span style={{position: 'relative', fontSize: 54, fontWeight: 700, letterSpacing: -1.5, color: sc.ink || '#fff'}}>{sc.pill}</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// The row of story dashes over the nine screens; the current one fills.
const StoryBar = () => {
  const frame = useCurrentFrame();
  return (
    <div style={{position: 'absolute', top: 40, left: 40, right: 40, display: 'flex', gap: 8}}>
      {SCREENS.map((_, i) => (
        <div key={i} style={{flex: 1, height: 5, borderRadius: 3, background: 'rgba(255,255,255,.25)', overflow: 'hidden'}}>
          <div style={{height: '100%', background: '#fff', width: `${interpolate(frame, [i * SCREEN_LEN, (i + 1) * SCREEN_LEN], [0, 100], clamp)}%`}} />
        </div>
      ))}
    </div>
  );
};

/* ---------- The campus: Dr. Smiley, the name, the link, the promise ---------- */
const Stripes = () => {
  const frame = useCurrentFrame();
  const colors = ['#2B3FA0', '#2E8BD0', CYAN, '#FF5A9E'];
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      {colors.map((c, i) => {
        const x = interpolate(frame, [i * 2, 16 + i * 2], [-1400, 1400], {...clamp, easing: Easing.inOut(Easing.cubic)});
        return <div key={c} style={{position: 'absolute', top: -300, left: x + i * 160, width: 380, height: 1900, background: c, transform: 'rotate(18deg)'}} />;
      })}
    </AbsoluteFill>
  );
};

// His acting over the ending: a smile as he arrives, a blink, then a laugh at "Safer care."
const smileyFace = (f: number): Face => {
  const seq: [number, Face][] = [[0, 'rest'], [14, 'smile1'], [18, 'smile2'], [22, 'smile'], [80, 'smile2'], [84, 'rest'],
    [120, 'blink1'], [122, 'blink2'], [124, 'shut'], [127, 'blink2'], [129, 'blink1'], [131, 'rest'],
    [165, 'lookL'], [195, 'rest'], [200, 'smile1'], [203, 'smile2'], [206, 'smile'], [212, 'laugh1'], [215, 'laugh2'], [218, 'laugh'],
    [224, 'laughB'], [229, 'laugh'], [234, 'laughB'], [239, 'laugh'], [244, 'smile']];
  let face: Face = 'rest';
  for (const [at, fc] of seq) if (f >= at) face = fc;
  return face;
};

const Campus = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const zoom = interpolate(frame, [0, 253], [1.12, 1.0]);
  const dr = spring({frame: frame - 10, fps, config: {damping: 12, stiffness: 120}});
  const face = smileyFace(frame);
  const laughing = face.startsWith('laugh');
  const bob = laughing ? Math.sin(frame * 1.3) * 4 : Math.sin(frame / 14) * 3;
  const pop = (at: number) => spring({frame: frame - at, fps, config: {damping: 12, stiffness: 170}});
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', top: 0, left: 0, right: 0, height: 690, overflow: 'hidden'}}>
        <Img src={staticFile('art/hero.jpg')} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: '30% 60%', transform: `scale(${zoom})`}} />
        <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(11,18,64,.35) 0%, rgba(11,18,64,0) 18%, rgba(11,18,64,0) 75%, rgba(22,32,90,.9) 100%)'}} />
        <div style={{position: 'absolute', top: 40, width: '100%', textAlign: 'center'}}>
          <span style={{fontSize: 19, letterSpacing: 4, fontWeight: 650, color: '#fff', background: 'rgba(11,18,64,.55)', padding: '8px 18px', borderRadius: 20}}>HACKENSACK UNIVERSITY MEDICAL CENTER</span>
        </div>
        <div style={{position: 'absolute', right: -6, bottom: -14 + (1 - dr) * 420 + bob, transform: `rotate(${laughing ? Math.sin(frame * 0.9) * 1.5 : 0}deg)`}}>
          <DrSmiley size={330} face={face} brow={face === 'lookL' ? 2 : laughing ? 3 : 0} />
        </div>
      </div>
      <div style={{position: 'absolute', top: 686, left: 0, right: 0, height: 8, background: `linear-gradient(90deg, #2B3FA0, ${CYAN}, #FF5A9E, #F7C948)`}} />
      <div style={{position: 'absolute', top: 728, width: '100%', textAlign: 'center'}}>
        <div style={fadeUp(frame, 6, fps, 30)}><Big size={84} style={{letterSpacing: -2.5}}>Interpreter Hub</Big></div>
        <div style={{fontSize: 34, color: 'rgba(225,235,255,.9)', marginTop: 10, fontWeight: 550, ...fadeUp(frame, 14, fps, 20)}}>Built here, for our patients.</div>
        <div style={{display: 'inline-block', marginTop: 22, background: '#fff', color: INK, fontSize: 34, fontWeight: 650, padding: '12px 40px', borderRadius: 40,
          transform: `scale(${pop(36)})`}}>interp-six.vercel.app</div>
        <div style={{fontSize: 26, color: 'rgba(225,235,255,.75)', marginTop: 12, ...fadeUp(frame, 46, fps, 14)}}>Live today, on any phone.</div>
        <div style={{marginTop: 26, ...fadeUp(frame, 120, fps, 30)}}><Big size={64} style={{letterSpacing: -1.5}}>Better words.</Big></div>
        <div style={{display: 'inline-block', marginTop: 8, background: CYAN, padding: '2px 22px 8px', borderRadius: 14, transform: `scale(${pop(195)})`}}>
          <Big size={64} style={{letterSpacing: -1.5, color: INK}}>Safer care.</Big>
        </div>
      </div>
      <div style={{position: 'absolute', bottom: 34, width: '100%', textAlign: 'center', fontSize: 18, letterSpacing: 5, fontWeight: 650, color: CYAN,
        opacity: interpolate(frame, [215, 230], [0, 1], clamp)}}>MADE BY THE HUMC INTERPRETER TEAM</div>
    </AbsoluteFill>
  );
};

/* ---------- The whole film ---------- */
const FEATURES_AT = s(10.733), OUTRO_AT = s(36.667);

export const Promo = () => (
  <AbsoluteFill style={{fontFamily: INTER, background: INK}}>
    <Backdrop />
    <Sequence durationInFrames={s(2)}><DoctorSays /></Sequence>
    <Sequence from={s(2)} durationInFrames={s(6.033) - s(2)}><Clock /></Sequence>
    <Sequence from={s(6.033)} durationInFrames={s(7.933) - s(6.033)}><WrongWord /></Sequence>
    <Sequence from={s(7.933)} durationInFrames={s(9.5) - s(7.933)}><RightWord /></Sequence>
    <Sequence from={s(9.5)} durationInFrames={FEATURES_AT - s(9.5)}><LogoBurst /></Sequence>
    {SCREENS.map((sc, i) => (
      <Sequence key={sc.shot} from={FEATURES_AT + i * SCREEN_LEN} durationInFrames={SCREEN_LEN}><ScreenScene s={sc} /></Sequence>
    ))}
    <Sequence from={FEATURES_AT} durationInFrames={OUTRO_AT - FEATURES_AT}><StoryBar /></Sequence>
    <Sequence from={OUTRO_AT + 10}><AbsoluteFill style={{background: `linear-gradient(180deg, ${NAVY}, ${INK})`}}><Squares count={12} seed="out" /></AbsoluteFill><Campus /></Sequence>
    <Sequence from={OUTRO_AT - 8} durationInFrames={30}><Stripes /></Sequence>
    <Audio src={staticFile('art/music.m4a')} />
  </AbsoluteFill>
);
