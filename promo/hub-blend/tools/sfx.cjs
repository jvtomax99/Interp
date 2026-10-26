/* The promo's sound effects (Jose, 2026-10-25): quiet clicks and chimes under v11's narrator and
   music, which stay untouched. The effects are from Damiano Caudullo's Motion Graphics starter kit
   (assets/sfx/, "made in code, use them anywhere"). Times are in the shipped video's clock
   (media/hub-promo.mp4), read off its frames: if the reel is rendered again, check them again.
   node promo/hub-blend/tools/sfx.cjs          writes assets/sfx-remake.m4a (the effects alone,
                                               the second <audio> in remake.html / remake-final.html)
   node promo/hub-blend/tools/sfx.cjs --promo  also writes media/hub-promo.mp4 again: its picture
                                               copied as is, the sound = music-remake.m4a + effects
   node promo/hub-blend/tools/sfx.cjs --60     the 1-minute cut's effects instead: assets/sfx-60s.m4a
                                               (the <audio id="sfx"> in remake-60.html / remake-60-final.html);
                                               its times read off the 60 s draft render's frames (2026-10-25) */
const path = require('path'), fs = require('fs'), { execFileSync } = require('child_process');
const PROJ = path.resolve(__dirname, '..'), REPO = path.resolve(PROJ, '../..');
const CUT60 = process.argv.includes('--60');
const DURATION = CUT60 ? 60 : 45.013; // music-remake.m4a, and the shipped video's sound

// [time (s), file, gain (dB), length (s, cut with a short fade; 0 = whole file)]
const CUES45 = [
  [1.89, 'counter', -17, 1.15], // the timer, 0.33s rolling down to zero from 1.97 (the file's first 85 ms are silent)
  [4.85, 'snap', -11, 0], // "¿Fallo cardíaco?" struck through
  [6.0, 'success', -13, 0], // "Insuficiencia cardíaca", the right word
  // each feature: its cyan box wipes in behind the second caption line (t0 + 0.3)
  ...[10, 13, 16, 19, 22, 25, 28, 31, 34].map((t) => [t + 0.3, 'tick', -10, 0]),
  [29.14, 'counter', -17, 0.85], // CoreCHI: 145 questions counting up (lands at 30.05)
  [43.9, 'chime', -12, 0], // the end card's last line, "Safer Care." on its cyan box
];
// the 1-minute cut (SHOTS-60s.md): the same moments on its clock, plus its three new shots
const CUES60 = [
  [3.02, 'counter', -19, 2.95], // the timer rolls from 3.1 to zero at 6.0 while he reads its line: quieter, it runs longer
  [8.43, 'snap', -11, 0], // "¿Fallo cardíaco?" struck through, on "Not for patients"
  [10.2, 'success', -13, 0], // "Insuficiencia cardíaca"
  // each feature's cyan caption box (start + 0.3)
  ...[17.45, 19.95, 22.45, 24.95, 27.45, 30.67, 33.17, 36.2, 38.7, 42.93, 46.27, 48.77].map((t) => [t + 0.3, 'tick', -10, 0]),
  [34.28, 'counter', -17, 0.9], // CoreCHI: 145 questions counting up (lands at about 35.2)
  [40.6, 'pop', -15, 0], // 3D Body: the Heart / Corazón card comes forward
  ...[0.4, 0.8, 1.2].map((u) => [42.93 + u, 'pop', -16, 0]), // Notifications: three drop onto the lock screen
  [46.8, 'star', -15, 0], // the knowledge brain starts lighting up
  [57.08, 'chime', -12, 0], // "Safer Care."
];
const CUES = CUT60 ? CUES60 : CUES45;

function effectsGraph(firstInput) {
  const parts = CUES.map(([t, f, db, len], i) => {
    const cut = len ? `atrim=0:${len},afade=t=out:st=${Math.max(0, len - 0.15)}:d=0.15,` : '';
    const ms = Math.round(t * 1000);
    return `[${firstInput + i}:a]aformat=sample_rates=48000:channel_layouts=stereo,${cut}volume=${db}dB,adelay=${ms}|${ms}[c${i}]`;
  });
  return { parts, labels: CUES.map((_, i) => `[c${i}]`).join('') };
}
const cueInputs = () => CUES.flatMap(([, f]) => ['-i', path.join(PROJ, 'assets/sfx', f + '.wav')]);
const ff = (args) => execFileSync('ffmpeg', ['-v', 'error', '-y', ...args], { stdio: 'inherit' });

// the effects alone, as long as the music
{
  const { parts, labels } = effectsGraph(0);
  const graph = [...parts, `${labels}amix=inputs=${CUES.length}:duration=longest:dropout_transition=0:normalize=0,apad=whole_dur=${DURATION},atrim=0:${DURATION}[out]`].join(';');
  ff([...cueInputs(), '-filter_complex', graph, '-map', '[out]', '-c:a', 'aac', '-b:a', '160k', path.join(PROJ, CUT60 ? 'assets/sfx-60s.m4a' : 'assets/sfx-remake.m4a')]);
  console.log(path.join(PROJ, CUT60 ? 'assets/sfx-60s.m4a' : 'assets/sfx-remake.m4a'));
}

// the app's video: same picture, music + effects (the effects mixed from the .wav files, not the stem,
// so nothing is encoded twice but the final sound)
if (!CUT60 && process.argv.includes('--promo')) {
  const video = path.join(REPO, 'media/hub-promo.mp4'), tmp = video + '.tmp.mp4';
  const { parts, labels } = effectsGraph(2);
  const graph = [...parts, `[1:a]aformat=sample_rates=48000:channel_layouts=stereo[m]`, `[m]${labels}amix=inputs=${CUES.length + 1}:duration=first:dropout_transition=0:normalize=0[out]`].join(';');
  ff(['-i', video, '-i', path.join(PROJ, 'assets/music-remake.m4a'), ...cueInputs(), '-filter_complex', graph,
    '-map', '0:v', '-map', '[out]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', tmp]);
  fs.renameSync(tmp, video);
  console.log(video);
}
