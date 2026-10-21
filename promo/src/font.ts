import {continueRender, delayRender, staticFile} from 'remotion';

// Inter, the app's interface face (variable, 100-700), from the test fonts.
const wait = delayRender('Inter');
const face = new FontFace('Inter', `url(${staticFile('art/inter.woff2')}) format('woff2')`, {weight: '100 700'});
face.load().then((f) => { document.fonts.add(f); continueRender(wait); });

export const INTER = 'Inter, system-ui, sans-serif';
