// Convert TTF fonts to three.js typeface JSON (for extruded 3D type). Port of TTFLoader's converter.
import opentype from 'opentype.js';
import fs from 'fs';
const jobs = [
  ['public/fonts/InterTight_800ExtraBold.ttf', 'src/data/intertight-800.typeface.json'],
  ['public/fonts/InstrumentSerif_400Regular.ttf', 'src/data/instrument-serif.typeface.json'],
];
const CHARS = ' 0123456789$,.+%?!-–—·/&\'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
for (const [src, dst] of jobs) {
  const buf = fs.readFileSync(src);
  const font = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
  const round = Math.round, scale = (100000) / ((font.unitsPerEm || 2048) * 72);
  const glyphs = {};
  for (const ch of CHARS) {
    const g = font.charToGlyph(ch);
    if (!g || g.unicode === undefined) continue;
    const token = {ha: round(g.advanceWidth * scale), x_min: round((g.xMin ?? 0) * scale), x_max: round((g.xMax ?? 0) * scale), o: ''};
    g.path.commands.forEach((c) => {
      if (c.type.toLowerCase() === 'c') c.type = 'b';
      token.o += c.type.toLowerCase() + ' ';
      if (c.x !== undefined && c.y !== undefined) token.o += round(c.x * scale) + ' ' + round(c.y * scale) + ' ';
      if (c.x1 !== undefined && c.y1 !== undefined) token.o += round(c.x1 * scale) + ' ' + round(c.y1 * scale) + ' ';
      if (c.x2 !== undefined && c.y2 !== undefined) token.o += round(c.x2 * scale) + ' ' + round(c.y2 * scale) + ' ';
    });
    glyphs[ch] = token;
  }
  const out = {glyphs, familyName: font.getEnglishName('fullName'), ascender: round(font.ascender * scale), descender: round(font.descender * scale),
    underlinePosition: font.tables.post.underlinePosition, underlineThickness: font.tables.post.underlineThickness,
    boundingBox: {xMin: font.tables.head.xMin, xMax: font.tables.head.xMax, yMin: font.tables.head.yMin, yMax: font.tables.head.yMax},
    resolution: 1000, original_font_information: font.tables.name};
  fs.writeFileSync(dst, JSON.stringify(out));
  console.log(dst, Object.keys(glyphs).length, 'glyphs');
}
