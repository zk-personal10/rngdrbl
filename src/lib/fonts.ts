import {continueRender, delayRender, staticFile} from 'remotion';

export const F = {
  sans: '"Inter Tight", system-ui, sans-serif',
  serif: '"Instrument Serif", Georgia, serif',
  mono: '"JetBrains Mono", ui-monospace, monospace',
};

const faces: [string, string, string, string][] = [
  ['Inter Tight', 'fonts/InterTight_300Light.ttf', '300', 'normal'],
  ['Inter Tight', 'fonts/InterTight_500Medium.ttf', '500', 'normal'],
  ['Inter Tight', 'fonts/InterTight_700Bold.ttf', '700', 'normal'],
  ['Inter Tight', 'fonts/InterTight_800ExtraBold.ttf', '800', 'normal'],
  ['Instrument Serif', 'fonts/InstrumentSerif_400Regular.ttf', '400', 'normal'],
  ['Instrument Serif', 'fonts/InstrumentSerif_400Regular_Italic.ttf', '400', 'italic'],
  ['JetBrains Mono', 'fonts/jetbrains-mono-latin-400-normal.woff2', '400', 'normal'],
  ['JetBrains Mono', 'fonts/jetbrains-mono-latin-500-normal.woff2', '500', 'normal'],
  ['JetBrains Mono', 'fonts/jetbrains-mono-latin-700-normal.woff2', '700', 'normal'],
];

let loading: Promise<void> | null = null;
export const fontsReady = { done: false };
export const loadFonts = () => {
  if (loading) return loading;
  const handle = delayRender('Loading fonts');
  loading = Promise.all(
    faces.map(async ([family, file, weight, style]) => {
      const face = new FontFace(family, `url(${staticFile(file)})`, {weight, style});
      await face.load();
      document.fonts.add(face);
    }),
  ).then(() => {
    fontsReady.done = true;
    continueRender(handle);
  });
  return loading;
};
