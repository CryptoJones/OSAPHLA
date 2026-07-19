# Español — Accessible Pan-Hispanic Language Academy

A private, offline-first Spanish course built from the complete language library in
`~/Downloads/Language`. The academy contains **36 weeks, 180 assessed sections,
4,320 question-bank items, and 88 graded-reader assignments**. It targets an ILR 2
core with ILR 2+/2+/2 stretch preparation; it does not claim to award an official
ILR rating.

The course is a single-user PWA. All settings, attempts, recordings, and progress
stay in the browser. There is no account system, telemetry, advertising, remote
database, or required runtime API.

## Start the academy

```bash
npm install
npm run sources:ingest -- --full
npm run dev
```

Open the local URL Vite prints. The first screen is a visual-comfort lab. It offers
system, high-contrast dark, high-contrast light, low-glare charcoal, warm paper,
and monochrome themes plus independent typography, spacing, reading-width, focus,
cursor, density, and motion controls.

Create a production PWA with `npm run build`, then preview it with
`npm run preview`. The app shell and authored course work offline after the first
load. Week media and the optional speech model use separate browser caches so they
can be managed without erasing progress. The Display page includes a one-button
offline media installer for all 180 videos and narration tracks.

## Source ingestion and privacy

The books are never copied into Git. `npm run sources:ingest -- --full`:

- verifies all 31 files and records SHA-256 hashes in `.local/source-catalog.json`;
- extracts PDF/EPUB structure and falls back to Tesseract for scanned material;
- OCRs image-dominant reader content when necessary;
- writes complete local reader text to `public/private/readers.json`.

Both output locations are ignored by Git. Override the default source location with
`ESPANOL_SOURCE_ROOT=/path/to/books`.

The completed local inventory covers 31 documents, 5,443 PDF pages, 1,184 EPUB
entries, approximately 2.15 million extracted words, and 14,006 mapped structural
nodes. The two image-only textbooks were OCRed across all 1,113 of their pages.

Run `npm run sources:audit` for the source-to-section and source-node report in
`.local/coverage-report.json` plus the non-sensitive in-app coverage summary. Run
`npm run sources:similarity` to ensure committed course prose does not contain an
exact 18-word passage from the private reader pack.

## Instruction and assessment

Every section includes:

- themeable semantic slides with optional local narration;
- a descriptive transcript and an optional rendered MP4;
- objectives, instruction, vocabulary, model sentences, and a productive task;
- an on-device microphone lab with optional local Whisper transcription;
- a 24-item bank: eight multiple choice, eight cloze, and eight ordering items;
- a randomized twelve-item attempt with four items of each type and an 85% target.

Ordering works through ordinary buttons and dedicated left/right controls, so drag
precision is never required. Early cloze work warns about missing accents; later
work requires them. Regional accepted forms are explicit rather than fuzzily graded.

## Local media rendering

The adaptive HTML presentation is the authoritative, fully themeable instruction.
Optional MP4 copies use the same slide data and descriptive text:

```bash
npm run render:media -- --section w01-briefing
npm run render:media -- --theme low-glare
npm run render:media -- --force --jobs 3
```

The second command renders every section and safely skips completed files. Add
`--force` to rebuild, and use `--jobs 1` through `--jobs 4` to control parallel
local rendering. Rendered media lives under `public/media/` and is ignored by
Git because it is reproducible and large. The renderer uses the local Kokoro
neural model, Chrome, and FFmpeg, creates captions and transcripts, and accepts any
supported visual theme. Narration follows a deterministic, balanced rotation:
original Dora, younger Dora Y1, younger Dora Y3, original Santa, and Dora/Santa E
each narrate 36 lessons. Each lesson keeps its assigned voice across rerenders.
English and Spanish use the same assigned voice profile with phoneme-level `en-us`
and `es-419` code-switching. Spanish terms inside English instruction retain Latin
American pronunciation (for example, `usted` is routed as `ustˈed`, never through
the English phonemizer). The generated Kokoro audio powers the MP4, adaptive slide
narration, and vocabulary pronunciation controls; browser system TTS is not used
for normal lesson playback.

Set `KOKORO_PYTHON` and `KOKORO_MODEL_DIR` when the existing courseware environment
is not installed in its usual location. Python dependencies are pinned in
`requirements-tts.txt`.

After a full render, run `npm run media:validate` to verify every section's video,
adaptive slide audio, vocabulary audio, captions, transcript, balanced narrator
assignment, encoding, and phoneme-level pronunciation audit.

## Quality gates

```bash
npm run curriculum:validate
npm test
npm run build
npm run test:e2e
# or all four:
npm run qa
```

The automated gates verify the complete curriculum contract, balanced assessments,
source coverage, production build, first-run accessibility, WCAG scanning, and
320-pixel reflow. See `docs/ACCESSIBILITY.md` and `docs/CURRICULUM.md` for the
behavioral specification.

---

*Proudly Made in Nebraska. Go Big Red! 🌽 <https://xkcd.com/2347/>*
