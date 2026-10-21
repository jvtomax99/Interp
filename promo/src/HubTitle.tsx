import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';

// A starter title card in the app's colours (--navy, --cyan, --bg).
export const HubTitle = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const rise = spring({frame, fps, config: {damping: 200}});
  const fade = interpolate(frame, [0, 20], [0, 1], {extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{background: '#F4F6FA', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, system-ui, sans-serif'}}>
      <div style={{opacity: fade, transform: `translateY(${(1 - rise) * 40}px)`, textAlign: 'center'}}>
        <div style={{fontSize: 84, fontWeight: 650, color: '#252E6D', letterSpacing: -2}}>Interpreter Hub</div>
        <div style={{marginTop: 16, height: 6, width: 160 * rise, background: '#01B8E6', borderRadius: 3, marginInline: 'auto'}} />
      </div>
    </AbsoluteFill>
  );
};
