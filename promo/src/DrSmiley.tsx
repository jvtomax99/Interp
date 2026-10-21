import {staticFile} from 'remotion';

// Dr. Smiley as the app draws him (drSmileyArt in index.html): his calm
// head and shoulders, one frame of the face strip, and his two brows.
export const FACES = ['rest', 'blink1', 'blink2', 'shut', 'wink1', 'wink2', 'wink', 'smile1', 'smile2', 'smile', 'laugh1', 'laugh2', 'laugh', 'laughB', 'lookL', 'lookR', 'love', 'sleep',
  'halfL', 'halfR', 'lookU', 'lookD', 'lookUL', 'lookUR', 'lookDL', 'lookDR', 'surprised', 'sad', 'worried', 'doubt'] as const;
export type Face = (typeof FACES)[number];
const W = 151, H = 111;

export const DrSmiley = ({face = 'rest', size, brow = 0}: {face?: Face; size: number; brow?: number}) => {
  const i = FACES.indexOf(face);
  return (
    <svg viewBox="4 4 112 112" width={size} height={size} style={{overflow: 'visible', display: 'block'}}>
      <image href={staticFile('art/base.webp')} x="14" y=".8" width="106" height="132.5" preserveAspectRatio="none" />
      <svg x="31.667" y="47.617" width="66.692" height="49.025" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        <image href={staticFile('art/face.webp')} x={-i * W} y="0" width={W * FACES.length} height={H} preserveAspectRatio="none" />
      </svg>
      <image href={staticFile('art/brow-l.webp')} x="33.875" y={39.446 - brow} width="28.708" height="14.354" preserveAspectRatio="none" />
      <image href={staticFile('art/brow-r.webp')} x="73.625" y={42.758 - brow} width="27.604" height="19.875" preserveAspectRatio="none" />
    </svg>
  );
};
