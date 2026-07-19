import { execFile as execFileCallback } from "node:child_process";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { promisify } from "node:util";

const execFile = promisify(execFileCallback);
const ROOT = resolve(import.meta.dirname, "..");
const course = JSON.parse(await readFile(resolve(ROOT, "src/data/course.json"), "utf8"));
const voiceManifest = JSON.parse(await readFile(resolve(ROOT, "public/media/voice-manifest.json"), "utf8"));
const requested = process.argv.includes("--section") ? process.argv[process.argv.indexOf("--section") + 1] : null;
const selectedSections = requested ? course.sections.filter((section) => section.id === requested) : course.sections;
if (!selectedSections.length) throw new Error(`Unknown section: ${requested}`);
const failures = [];
let totalSeconds = 0;
let totalBytes = 0;
let pronunciationUtterances = 0;
let mixedLanguageSentences = 0;
const profileCounts = { dora: 0, y1: 0, y3: 0, santa: 0, e: 0 };
const technicalTerms = ["-aba", "-ar", "-er", "-ía", "-ir", "a/e/i/o/u", "acabar de", "antes de", "antes de que", "a menos que", "cuando", "cuyo", "dar", "deber", "después de", "decir", "distinción", "doblar", "el que", "es la", "estar", "gustar", "haber", "hacer", "hay", "ir", "le", "leísmo", "les", "lo que", "nosotros", "para", "para que", "pero", "poder", "por", "que", "quien", "querer", "quisiera", "saber", "se", "seguir", "ser", "si", "seseo", "son las", "tener", "tú", "usted", "ustedes", "venir", "vos", "voseo", "vosotros", "yeísmo"];
const spanishTerms = [...new Set([...technicalTerms, ...course.sections.flatMap((section) => section.vocabulary.map((entry) => entry.es))])];
const termPatterns = spanishTerms.map((term) => ({ term, pattern: new RegExp(`(?<!\\p{L})${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replaceAll(" ", "\\s+")}(?!\\p{L})`, "iu") }));

async function countFile(path, label) {
  try {
    const fileStat = await stat(path);
    if (fileStat.size === 0) failures.push(`${label} is empty`);
    totalBytes += fileStat.size;
  } catch { failures.push(`${label} is missing`); }
}

for (const section of selectedSections) {
  const directory = resolve(ROOT, "public/media", section.id);
  const files = ["lesson.mp4", "narration.mp3", "captions.vtt", "transcript.txt", "voice.json", "pronunciation.json"];
  for (const file of files) {
    await countFile(resolve(directory, file), `${section.id}/${file}`);
  }
  for (let index = 0; index < section.slides.length; index += 1) await countFile(resolve(directory, "slides", `${String(index).padStart(2, "0")}.mp3`), `${section.id}/slides/${String(index).padStart(2, "0")}.mp3`);
  for (let index = 0; index < section.vocabulary.length; index += 1) await countFile(resolve(directory, "vocabulary", `${String(index).padStart(2, "0")}.mp3`), `${section.id}/vocabulary/${String(index).padStart(2, "0")}.mp3`);
  try {
    const captions = await readFile(resolve(directory, "captions.vtt"), "utf8");
    if (!captions.startsWith("WEBVTT") || !captions.includes("-->")) failures.push(`${section.id}/captions.vtt is invalid`);
    if ((captions.match(/-->/g) || []).length !== section.slides.length) failures.push(`${section.id}/captions.vtt cue count does not match slides`);
    const { stdout } = await execFile("ffprobe", ["-v","error","-select_streams","a:0","-show_entries","stream=codec_name,sample_rate,channels:format=duration","-of","json",resolve(directory,"lesson.mp4")]);
    const probe = JSON.parse(stdout);
    const seconds = Number(probe.format?.duration);
    if (!Number.isFinite(seconds) || seconds < 20) failures.push(`${section.id}/lesson.mp4 has invalid duration`);
    else totalSeconds += seconds;
    const stream = probe.streams?.[0];
    if (stream?.codec_name !== "aac" || stream?.sample_rate !== "48000" || stream?.channels !== 2) failures.push(`${section.id}/lesson.mp4 is not 48 kHz stereo AAC`);
  } catch { failures.push(`${section.id}/lesson.mp4 could not be probed`); }
  try {
    const voice = JSON.parse(await readFile(resolve(directory, "voice.json"), "utf8"));
    const expected = voiceManifest.assignments[section.id];
    if (voice.pipelineVersion !== 3) failures.push(`${section.id}/voice.json is not pronunciation pipeline 3`);
    if (voice.profile !== expected) failures.push(`${section.id} voice ${voice.profile} does not match manifest ${expected}`);
    if (voice.languageRouting !== "phoneme-level es-419/en-us code-switching") failures.push(`${section.id} does not use phoneme-level language routing`);
    if (voice.profile in profileCounts) profileCounts[voice.profile] += 1;
    else failures.push(`${section.id} has unknown voice profile ${voice.profile}`);

    const audit = JSON.parse(await readFile(resolve(directory, "pronunciation.json"), "utf8"));
    if (audit.profile !== voice.profile) failures.push(`${section.id}/pronunciation.json voice mismatch`);
    if (audit.utterances?.length !== section.slides.length + section.vocabulary.length) failures.push(`${section.id}/pronunciation.json utterance count mismatch`);
    for (const utterance of audit.utterances || []) {
      pronunciationUtterances += 1;
      for (const sentence of utterance.sentences || []) {
        if (!sentence.phonemes) failures.push(`${section.id} has an empty phoneme sequence`);
        const languages = new Set((sentence.segments || []).map((segment) => segment.lang));
        if (languages.size > 1) mixedLanguageSentences += 1;
        if (![...languages].every((language) => language === "en-us" || language === "es-419")) failures.push(`${section.id} has an invalid language segment`);
        for (const segment of sentence.segments || []) {
          if (segment.lang !== "en-us") continue;
          const misplaced = termPatterns.find(({ pattern }) => pattern.test(segment.text));
          if (misplaced) failures.push(`${section.id} routes Spanish term “${misplaced.term}” through English: ${sentence.text}`);
          if (/[áéíóúñü¿¡]/iu.test(segment.text)) failures.push(`${section.id} routes marked Spanish text through English: ${sentence.text}`);
        }
        if (/ˈʌstᵻd/u.test(sentence.phonemes)) failures.push(`${section.id} contains the rejected English phonemes for usted`);
      }
    }
  } catch (error) { failures.push(`${section.id} pronunciation metadata could not be validated: ${error.message}`); }
}

if (!requested && JSON.stringify(profileCounts) !== JSON.stringify({ dora: 36, y1: 36, y3: 36, santa: 36, e: 36 })) failures.push(`voice distribution is not balanced: ${JSON.stringify(profileCounts)}`);
if (voiceManifest.version !== 2) failures.push("voice manifest is not pronunciation pipeline version 2");
if (mixedLanguageSentences === 0) failures.push("no mixed-language sentences were audited");

if (failures.length) {
  console.error(failures.slice(0, 30).join("\n"));
  if (failures.length > 30) console.error(`…and ${failures.length - 30} more`);
  process.exit(1);
}

console.log(`MEDIA VALID: ${selectedSections.length} section video(s), ${(totalSeconds / 3600).toFixed(1)} instructional hours, ${(totalBytes / 1024 / 1024).toFixed(1)} MiB, ${pronunciationUtterances} pronunciation utterances, ${mixedLanguageSentences} phoneme-level language switches, voices ${JSON.stringify(profileCounts)}.`);
