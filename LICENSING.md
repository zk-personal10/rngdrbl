# Media licensing & replacement list

## What is in this film today
| Element | Origin | License |
|---|---|---|
| All 3D sequences, models, environments, typography, motion graphics | Original, built in this repo (Three.js / Remotion) | Yours |
| Narration (`public/audio/vo/*.wav`, `narration.wav`) | Generated with Kokoro-82M TTS, voice `af_heart` | Model: Apache-2.0. Output: usable commercially; disclose synthetic voice (credited on the end card). |
| Score & SFX (`public/audio/stems/*`, `soundtrack.wav`) | Synthesized from code in `tools/build_score.py`, no samples | Yours |
| Fonts | Inter Tight, Instrument Serif, JetBrains Mono | SIL Open Font License 1.1 |

**No archival footage, photographs, logos or trademarks of third parties are embedded.** Company and people
names appear as plain text in the film's own typography. Product models are stylized, not replicas.

## Footage that needs licensing (slots are ready)
Each slot lives in `src/data/media-manifest.json`. To use one: obtain a license, put the file at the path
listed, set `"available": true`, adjust `trimFrom` (seconds into the clip) and re-render. The clip is
graded, vignetted and labelled "ARCHIVAL · <rights holder>" automatically, over the recreation for that window.

| Slot | Window in film | Content | Rights holder to contact | Notes |
|---|---|---|---|---|
| ST-01 | 0:05.6–0:15.0 | Shark Tank S5 — DoorBot pitch, entrance & demo | Sony Pictures Television (producer) / ABC – Disney (broadcaster) | Clip licensing via Sony Pictures Television clip licensing. Do **not** rip from YouTube (ToS + copyright). |
| ST-02 | 1:29.0–2:06.4 | Sharks going out, O'Leary offer, "no deal" | Sony Pictures Television / ABC | Same as above. Once licensed, transcribe exact dialogue and replace paraphrases if desired. |
| IV-01 | 0:38.5–0:51.0 | Siminoff interview on the garage origin | Outlet-specific (CNBC, Bloomberg, GeekWire, How I Built This/NPR audio) | Many interviews exist; pick one and license from that outlet. |
| AD-01 | 3:18.0–3:28.4 | Ring early ad / product demo (2014–2017) | Ring LLC (Amazon) | Ring press/media kit or corporate communications. |
| NW-01 | 4:12.4–4:16.4 | News coverage of the Feb 27, 2018 announcement | Broadcaster (CNBC, Bloomberg, Reuters TV) | Reuters/AP footage is licensable by the clip. |
| ST-03 | 4:30.4–4:37.0 | Siminoff as guest Shark, S10 (Oct 2018) | Sony Pictures Television / ABC | |

Photography (optional upgrades): Getty Images / AP Images / Reuters Pictures for editorial stills of Siminoff,
DoorBot and Ring products. Editorial licenses usually cover documentary use.

## Things to replace or double-check before public release
- Shark concerns are paraphrased from recaps (on-screen label says so). Replace with licensed footage or verbatim transcript if you want quotes.
- Synthetic narration — consider re-recording with a human narrator; the script is in `script/narration.json`.
- Phone UI, "new order" toasts and Branson notification are illustrative (labelled on screen).
