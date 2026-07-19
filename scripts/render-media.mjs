import { execFile as execFileCallback } from "node:child_process";
import { access, mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { promisify } from "node:util";
import { chromium } from "playwright";

const execFile = promisify(execFileCallback);
const ROOT = resolve(import.meta.dirname, "..");
const course = JSON.parse(await readFile(resolve(ROOT, "src/data/course.json"), "utf8"));
const requested = process.argv.includes("--section") ? process.argv[process.argv.indexOf("--section") + 1] : null;
const force = process.argv.includes("--force");
const theme = process.argv.includes("--theme") ? process.argv[process.argv.indexOf("--theme") + 1] : "contrast-dark";
const jobs = Math.max(1, Math.min(4, Number(process.argv.includes("--jobs") ? process.argv[process.argv.indexOf("--jobs") + 1] : 2) || 2));
const chrome = process.env.CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const voiceOverride = process.argv.includes("--voice") ? process.argv[process.argv.indexOf("--voice") + 1] : null;
const manifestOnly = process.argv.includes("--manifest-only");
const voiceProfiles = ["dora", "y1", "y3", "santa", "e"];
const voiceLabels = { dora: "Original Dora", y1: "Younger Dora Y1", y3: "Younger Dora Y3", santa: "Original Santa", e: "Dora/Santa E" };
const spanishTerms = [...new Set(course.sections.flatMap((section) => (section.vocabulary || []).map((entry) => entry.es)))];
const themes = {
  "contrast-dark": { bg: "#000000", panel: "#101010", text: "#ffffff", muted: "#e6e6e6", accent: "#5effc1", second: "#ffe45c", border: "#ffffff" },
  "contrast-light": { bg: "#ffffff", panel: "#f4f4f4", text: "#070707", muted: "#292929", accent: "#004c3f", second: "#6a4300", border: "#111111" },
  "low-glare": { bg: "#171a1c", panel: "#21262a", text: "#d4d8d5", muted: "#a9b0ac", accent: "#a4c7ba", second: "#c7b88c", border: "#5f6966" },
  "warm-paper": { bg: "#f3ead7", panel: "#fff9ec", text: "#291f17", muted: "#5b4939", accent: "#155c50", second: "#805200", border: "#6d5b48" },
  monochrome: { bg: "#080808", panel: "#171717", text: "#f5f5f5", muted: "#c7c7c7", accent: "#ffffff", second: "#dedede", border: "#aaaaaa" }
};
const palette = themes[theme] || themes["contrast-dark"];

async function run(command, args) {
  try { return (await execFile(command, args, { maxBuffer: 32 * 1024 * 1024, encoding: "utf8" })).stdout; }
  catch (error) { throw new Error(`${command} failed: ${error.stderr || error.message}`); }
}

async function closeWithTimeout(operation, label) {
  let timer;
  try {
    await Promise.race([
      operation(),
      new Promise((resolveClose) => { timer = setTimeout(() => { console.warn(`${label} close timed out; continuing after completed file writes.`); resolveClose(); }, 5_000); })
    ]);
  } catch (error) { console.warn(`${label} close warning: ${error.message}`); }
  finally { clearTimeout(timer); }
}

function escapeHtml(value) { return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;"); }
function seededRandom(seedText) {
  let seed = 2166136261;
  for (const character of seedText) { seed ^= character.codePointAt(0); seed = Math.imul(seed, 16777619); }
  return () => { seed += 0x6D2B79F5; let value = seed; value = Math.imul(value ^ value >>> 15, value | 1); value ^= value + Math.imul(value ^ value >>> 7, value | 61); return ((value ^ value >>> 14) >>> 0) / 4294967296; };
}
function buildVoiceAssignments() {
  const random = seededRandom(`${course.id}:voice-rotation-v1`);
  const pool = course.sections.map((_, index) => voiceProfiles[index % voiceProfiles.length]);
  for (let index = pool.length - 1; index > 0; index -= 1) { const other = Math.floor(random() * (index + 1)); [pool[index], pool[other]] = [pool[other], pool[index]]; }
  return new Map(course.sections.map((section, index) => [section.id, pool[index]]));
}
const assignedVoice = buildVoiceAssignments();

async function firstExecutable(candidates) {
  for (const candidate of candidates.filter(Boolean)) {
    if (await access(candidate).then(() => true).catch(() => false)) return candidate;
  }
  throw new Error("Kokoro Python environment not found. Set KOKORO_PYTHON to a Python with requirements-tts.txt installed.");
}
function slideHtml(slide, index, total) {
  const body = slide.body.length > 1 ? `<ul>${slide.body.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ul>` : `<p>${escapeHtml(slide.body[0])}</p>`;
  return `<!doctype html><meta charset="utf-8"><style>
  *{box-sizing:border-box}body{margin:0;width:1280px;height:720px;overflow:hidden;background:${palette.bg};color:${palette.text};font-family:Arial,sans-serif;padding:74px 86px;display:flex;flex-direction:column;justify-content:center;border:14px solid ${palette.panel}}
  body:after{content:"";position:absolute;right:-90px;bottom:-110px;width:340px;height:340px;border:58px solid ${palette.accent}14;border-radius:50%}small{position:absolute;right:52px;top:40px;color:${palette.muted};font-size:20px;letter-spacing:2px}.kicker{color:${palette.accent};text-transform:uppercase;letter-spacing:4px;font-weight:800;font-size:20px;border-left:7px solid ${palette.accent};padding-left:18px}h1{font-size:66px;line-height:1.05;max-width:880px;margin:22px 0;color:${palette.text}}p,li{font-size:31px;line-height:1.45;max-width:980px}li{margin:12px 0}footer{position:absolute;left:86px;bottom:38px;color:${palette.second};font-weight:700;font-size:18px;letter-spacing:2px}</style>
  <small>${String(index + 1).padStart(2,"0")} / ${String(total).padStart(2,"0")}</small>${slide.kicker ? `<div class="kicker">${escapeHtml(slide.kicker)}</div>` : ""}<h1>${escapeHtml(slide.title)}</h1>${body}<footer>ESPAÑOL · ADAPTIVE PAN-HISPANIC ACADEMY</footer>`;
}

function timestamp(seconds) {
  const hours = Math.floor(seconds / 3600); const minutes = Math.floor(seconds % 3600 / 60); const secs = seconds % 60;
  return `${String(hours).padStart(2,"0")}:${String(minutes).padStart(2,"0")}:${secs.toFixed(3).padStart(6,"0")}`;
}

async function renderSection(context, section, profile, kokoroPython) {
  const destination = resolve(ROOT, `public/media/${section.id}`);
  await mkdir(destination, { recursive: true });
  await mkdir(`${destination}/slides`, { recursive: true });
  await mkdir(`${destination}/vocabulary`, { recursive: true });
  const exists = await access(`${destination}/lesson.mp4`).then(() => true).catch(() => false);
  const metadata = await readFile(`${destination}/voice.json`, "utf8").then(JSON.parse).catch(() => null);
  if (!force && exists && metadata?.pipelineVersion === 3 && metadata?.profile === profile) { console.log(`skip ${section.id} (${profile})`); return; }
  const work = await mkdtemp(join(tmpdir(), `espanol-${section.id}-`));
  const visualConcat = [];
  const audioConcat = [];
  const captions = ["WEBVTT", ""];
  let clock = 0;
  const page = await context.newPage();
  try {
    const utterances = [];
    for (let index = 0; index < section.slides.length; index += 1) {
      const slide = section.slides[index];
      const stem = join(work, String(index).padStart(2,"0"));
      await page.setContent(slideHtml(slide, index, section.slides.length));
      await page.screenshot({ path: `${stem}.png`, type: "png" });
      utterances.push({ file: `${String(index).padStart(2,"0")}.wav`, text: `${slide.title}. ${slide.body.join(" ")}` });
    }
    for (let index = 0; index < section.vocabulary.length; index += 1) {
      utterances.push({ file: `vocab-${String(index).padStart(2,"0")}.wav`, text: section.vocabulary[index].es });
    }
    const utterancePath = join(work, "utterances.json");
    const pronunciationAuditPath = join(work, "pronunciation.json");
    await writeFile(utterancePath, JSON.stringify({ spanishTerms, utterances }));
    await run(kokoroPython, [resolve(ROOT, "scripts/kokoro-course-tts.py"), "--profile", profile, "--input-json", utterancePath, "--output-dir", work, "--audit-json", pronunciationAuditPath]);
    for (let index = 0; index < section.slides.length; index += 1) {
      const stem = join(work, String(index).padStart(2,"0"));
      const speech = utterances[index].text;
      const duration = Number((await run("ffprobe", ["-v","error","-show_entries","format=duration","-of","default=noprint_wrappers=1:nokey=1",`${stem}.wav`])).trim());
      await run("ffmpeg", ["-y","-v","error","-i",`${stem}.wav`,"-ar","48000","-ac","2","-c:a","libmp3lame","-b:a","192k",`${destination}/slides/${String(index).padStart(2,"0")}.mp3`]);
      visualConcat.push(`file '${stem}.png'`, `duration ${duration.toFixed(3)}`);
      audioConcat.push(`file '${stem}.wav'`);
      captions.push(`${index + 1}`, `${timestamp(clock)} --> ${timestamp(clock + duration)}`, speech, "");
      clock += duration;
    }
    for (let index = 0; index < section.vocabulary.length; index += 1) {
      await run("ffmpeg", ["-y","-v","error","-i",join(work,`vocab-${String(index).padStart(2,"0")}.wav`),"-ar","48000","-ac","2","-c:a","libmp3lame","-b:a","192k",`${destination}/vocabulary/${String(index).padStart(2,"0")}.mp3`]);
    }
    const lastStem = join(work, String(section.slides.length - 1).padStart(2,"0"));
    visualConcat.push(`file '${lastStem}.png'`);
    await writeFile(join(work, "visuals.txt"), visualConcat.join("\n"));
    await writeFile(join(work, "audio.txt"), audioConcat.join("\n"));
    await run("ffmpeg", ["-y","-f","concat","-safe","0","-i",join(work,"visuals.txt"),"-f","concat","-safe","0","-i",join(work,"audio.txt"),"-vf","scale=1280:720,format=yuv420p","-af",`aresample=48000,afade=t=in:st=0:d=0.45,afade=t=out:st=${Math.max(0, clock - 0.45).toFixed(3)}:d=0.45`,"-r","2","-c:v","libx264","-preset","veryfast","-crf","24","-c:a","aac","-b:a","192k","-ac","2","-movflags","+faststart","-shortest",`${destination}/lesson.mp4`]);
    await run("ffmpeg", ["-y","-i",`${destination}/lesson.mp4`,"-vn","-ar","48000","-ac","2","-c:a","libmp3lame","-b:a","192k",`${destination}/narration.mp3`]);
    await writeFile(`${destination}/captions.vtt`, captions.join("\n"));
    await writeFile(`${destination}/transcript.txt`, `${section.media.transcript}\n`);
    await writeFile(`${destination}/pronunciation.json`, await readFile(pronunciationAuditPath));
    await writeFile(`${destination}/voice.json`, `${JSON.stringify({ pipelineVersion: 3, profile, label: voiceLabels[profile], assignment: "balanced-seeded-v1", languageRouting: "phoneme-level es-419/en-us code-switching", sourceRate: 24000, deliveryRate: 48000, codec: "AAC 192 kbps stereo", adaptiveSlideAudio: "MP3 192 kbps stereo", vocabularyAudio: "MP3 192 kbps stereo" }, null, 2)}\n`);
    console.log(`rendered ${section.id}: ${clock.toFixed(1)}s, ${section.slides.length} beats, voice=${profile}, theme=${theme}`);
  } finally { await closeWithTimeout(() => page.close(), `page ${section.id}`); await rm(work, { recursive: true, force: true }); }
}

const selected = requested ? course.sections.filter((section) => section.id === requested) : course.sections;
if (!selected.length) throw new Error(`Unknown section: ${requested}`);
if (voiceOverride && !voiceProfiles.includes(voiceOverride)) throw new Error(`Unknown voice profile: ${voiceOverride}`);
await mkdir(resolve(ROOT, "public/media"), { recursive: true });
await writeFile(resolve(ROOT, "public/media/voice-manifest.json"), `${JSON.stringify({ version: 2, strategy: "balanced-seeded", languageRouting: "phoneme-level es-419/en-us code-switching", profiles: voiceLabels, counts: Object.fromEntries(voiceProfiles.map((profile) => [profile, course.sections.filter((section) => assignedVoice.get(section.id) === profile).length])), assignments: Object.fromEntries(course.sections.map((section) => [section.id, assignedVoice.get(section.id)])) }, null, 2)}\n`);
if (manifestOnly) {
  console.log("VOICE MANIFEST COMPLETE: 180 stable, balanced assignments.");
  process.exit(0);
}
const kokoroPython = await firstExecutable([process.env.KOKORO_PYTHON, "/Users/akclark/source/repos/systems-design/pipeline/.venv/bin/python", "/Users/akclark/source/repos/intro-statistics/pipeline/.venv/bin/python"]);
const browser = await chromium.launch({ headless: true, executablePath: chrome });
const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
let nextSection = 0;
async function renderWorker() {
  while (nextSection < selected.length) {
    const section = selected[nextSection]; nextSection += 1;
    await renderSection(context, section, voiceOverride || assignedVoice.get(section.id), kokoroPython);
  }
}
try { await Promise.all(Array.from({ length: Math.min(jobs, selected.length) }, renderWorker)); }
finally {
  await closeWithTimeout(() => context.close(), "browser context");
  await closeWithTimeout(() => browser.close(), "browser");
}
console.log(`MEDIA COMPLETE: ${selected.length} section(s).`);
process.exit(0);
