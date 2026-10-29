/* The whole guide as one video: the opening card, then each chapter after its title card
   (out/card<n>.png from cards.cjs, renders/ch<N>.mp4 from draft.cjs at scale 1).
   Writes renders/claude-guide.mp4.  node promo/claude-guide/tools/join.cjs */
const path = require('path'), { execFileSync } = require('child_process');
const PROJ = path.resolve(__dirname, '..'), R = (...p) => path.join(PROJ, ...p);
const parts = [['card', 0, 2.6, 'chime'], ['card', 1, 1.4, 'pop'], ['ch', 1], ['card', 2, 1.4, 'pop'], ['ch', 2],
  ['card', 3, 1.4, 'pop'], ['ch', 3], ['card', 4, 1.4, 'pop'], ['ch', 4]];
const args = ['-nostdin', '-v', 'error', '-y'], chains = [];
parts.forEach(([kind, n, dur, sound], i) => {
  if (kind === 'card') {
    args.push('-loop', '1', '-framerate', '30', '-t', String(dur), '-i', R('out', `card${n}.png`), '-i', R('sfx', sound + '.wav'));
  } else args.push('-i', R('renders', `ch${n}.mp4`));
});
let k = 0; const segs = [];
parts.forEach(([kind, n, dur], i) => {
  if (kind === 'card') {
    // the card pops in a little, its sound a beat after it appears
    chains.push(`[${k}:v]scale=1080:1920,setsar=1,format=yuv420p,fps=30,fade=t=in:st=0:d=0.25:color=0xFFF6E9[v${i}]`);
    chains.push(`[${k + 1}:a]aresample=48000,aformat=channel_layouts=stereo,volume=0.5,adelay=150:all=1,apad=whole_dur=${dur}[a${i}]`);
    k += 2;
  } else {
    chains.push(`[${k}:v]setsar=1,format=yuv420p,fps=30[v${i}]`);
    chains.push(`[${k}:a]aresample=48000,aformat=channel_layouts=stereo[a${i}]`);
    k += 1;
  }
  segs.push(`[v${i}][a${i}]`);
});
chains.push(`${segs.join('')}concat=n=${parts.length}:v=1:a=1[v][a]`);
execFileSync('ffmpeg', [...args, '-filter_complex', chains.join(';'), '-map', '[v]', '-map', '[a]',
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '23', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart',
  R('renders', 'claude-guide.mp4')], { stdio: 'inherit' });
console.log(R('renders', 'claude-guide.mp4'));
