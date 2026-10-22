/* A .woff/.ttf/.otf font as the typeface JSON Three.js's FontLoader reads (Latin letters,
   digits and punctuation only). Needs opentype.js on NODE_PATH.
   NODE_PATH=<dir with opentype.js> node promo/hub-blend/tools/typeface.cjs <font.woff> <out.typeface.json> */
const fs = require('fs');
const opentype = require('opentype.js');
const [src, out] = process.argv.slice(2);
const font = opentype.parse(fs.readFileSync(src).buffer.slice(0));
const r = (v) => Math.round(v);
const glyphs = {};
const chars = ' !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[]_abcdefghijklmnopqrstuvwxyz{|}¿¡áéíóúñÁÉÍÓÚÑü·';
for (const ch of chars) {
  const g = font.charToGlyph(ch);
  if (!g || g.index === 0 && ch !== ' ') continue;
  let o = '';
  // y is up in the font; FontLoader expects font units, y up
  for (const c of g.getPath(0, 0, font.unitsPerEm).commands) {
    if (c.type === 'M') o += `m ${r(c.x)} ${r(-c.y)} `;
    else if (c.type === 'L') o += `l ${r(c.x)} ${r(-c.y)} `;
    else if (c.type === 'Q') o += `q ${r(c.x)} ${r(-c.y)} ${r(c.x1)} ${r(-c.y1)} `;
    else if (c.type === 'C') o += `b ${r(c.x)} ${r(-c.y)} ${r(c.x1)} ${r(-c.y1)} ${r(c.x2)} ${r(-c.y2)} `;
  }
  const bb = g.getBoundingBox();
  glyphs[ch] = { ha: r(g.advanceWidth), x_min: r(bb.x1), x_max: r(bb.x2), o: o.trim() };
}
const bb = font.tables.head, fam = (font.names.fontFamily || font.names.windows?.fontFamily || font.names.unicode?.fontFamily || { en: "font" }).en;
fs.writeFileSync(out, JSON.stringify({
  glyphs, familyName: fam, ascender: font.ascender, descender: font.descender,
  underlinePosition: font.tables.post.underlinePosition, underlineThickness: font.tables.post.underlineThickness,
  boundingBox: { xMin: bb.xMin, yMin: bb.yMin, xMax: bb.xMax, yMax: bb.yMax }, resolution: font.unitsPerEm,
  original_font_information: { format: 0, fontFamily: fam },
}));
console.log(out, Object.keys(glyphs).length, 'glyphs');
