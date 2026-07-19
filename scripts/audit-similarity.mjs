import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const course = JSON.parse(await readFile(resolve(ROOT, "src/data/course.json"), "utf8"));
let readers;
try { readers = JSON.parse(await readFile(resolve(ROOT, "public/private/readers.json"), "utf8")); }
catch { console.log("SIMILARITY: private reader pack is absent; no copyrighted source text is present to compare."); process.exit(0); }

const normalize = (value) => value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9ñ]+/g, " ").trim();
const windowSize = 18;
const sourceWindows = new Map();
for (const source of readers.sources) for (const chapter of source.chapters) {
  const words = normalize(chapter.text).split(/\s+/);
  for (let index = 0; index <= words.length - windowSize; index += 1) sourceWindows.set(words.slice(index, index + windowSize).join(" "), `${source.sourceId}:${chapter.entry}`);
}

const matches = [];
for (const section of course.sections) {
  const committed = normalize([section.media.transcript, section.reading ?? "", section.culture ?? "", section.mission ?? ""].join(" ")).split(/\s+/);
  for (let index = 0; index <= committed.length - windowSize; index += 1) {
    const phrase = committed.slice(index, index + windowSize).join(" ");
    const source = sourceWindows.get(phrase);
    if (source) matches.push({ sectionId: section.id, source, phrase });
  }
}
if (matches.length) { console.error(JSON.stringify(matches.slice(0, 20), null, 2)); throw new Error(`${matches.length} exact ${windowSize}-word source matches found in committed course prose.`); }
console.log(`SIMILARITY: no exact ${windowSize}-word source passages appear in committed course prose.`);
