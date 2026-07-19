import { createHash } from "node:crypto";
import { execFile as execFileCallback } from "node:child_process";
import { createReadStream } from "node:fs";
import { mkdtemp, mkdir, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, extname, join, resolve } from "node:path";
import { promisify } from "node:util";
import { sources } from "./source-inventory.mjs";

const execFile = promisify(execFileCallback);
const ROOT = resolve(import.meta.dirname, "..");
const SOURCE_ROOT = resolve(process.env.ESPANOL_SOURCE_ROOT || "/Users/akclark/Downloads/Language");
const OCR = process.argv.includes("--ocr") || process.argv.includes("--full");
const FULL = process.argv.includes("--full");

function normalized(value) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function cleanMarkup(markup) {
  return markup
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, "\n")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&").replace(/&quot;/gi, "\"").replace(/&#39;|&apos;/gi, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number.parseInt(dec, 10)))
    .split(/\r?\n/).map((line) => line.replace(/\s+/g, " ").trim()).filter(Boolean).join("\n");
}

async function sha256(path) {
  return new Promise((resolveHash, reject) => {
    const hash = createHash("sha256");
    const input = createReadStream(path);
    input.on("error", reject);
    input.on("data", (chunk) => hash.update(chunk));
    input.on("end", () => resolveHash(hash.digest("hex")));
  });
}

async function run(command, args, options = {}) {
  try {
    return (await execFile(command, args, { maxBuffer: 128 * 1024 * 1024, encoding: options.encoding ?? "utf8" })).stdout;
  } catch (error) {
    if (options.optional) return options.encoding === null ? Buffer.alloc(0) : "";
    throw new Error(`${command} ${args.join(" ")} failed: ${error.message}`);
  }
}

function candidateNodes(text) {
  const lines = text.split("\n").map((line) => line.trim()).filter((line) => line.length >= 3 && line.length <= 150);
  const heading = /^(chapter|lesson|lecci[oó]n|unidad|cap[ií]tulo|week|day|step|part|[0-9]{1,2}[.)])\s*[0-9ivx.-]*\s*[:—-]?\s*.+/i;
  const seen = new Set();
  return lines.filter((line) => heading.test(line)).filter((line) => { const key = normalized(line); if (seen.has(key)) return false; seen.add(key); return true; }).map((label, index) => ({ id: `node-${index + 1}`, label }));
}

async function ocrPdfFront(path, pages) {
  const dir = await mkdtemp(join(tmpdir(), "espanol-ocr-"));
  const pageLimit = FULL ? pages : Math.min(pages, 45);
  const chunks = [];
  try {
    await run("pdftoppm", ["-f", "1", "-l", String(pageLimit), "-jpeg", "-scale-to", "1800", path, join(dir, "page")]);
    const images = (await readdir(dir)).filter((file) => /\.jpe?g$/i.test(file)).sort((left, right) => left.localeCompare(right, undefined, { numeric: true }));
    let nextImage = 0;
    async function worker() {
      while (nextImage < images.length) {
        const index = nextImage; nextImage += 1;
        chunks[index] = await run("tesseract", [join(dir, images[index]), "stdout", "-l", "eng+spa"], { optional: true });
      }
    }
    await Promise.all(Array.from({ length: Math.min(4, images.length) }, worker));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
  return chunks.join("\n");
}

async function inspectPdf(path) {
  const info = await run("pdfinfo", [path]);
  const pages = Number(info.match(/^Pages:\s+(\d+)/m)?.[1] || 0);
  const inspectedPages = FULL ? pages : Math.min(pages, 90);
  let frontText = await run("pdftotext", ["-f", "1", "-l", String(inspectedPages), "-layout", path, "-"], { optional: true });
  let extraction = "text";
  if (frontText.trim().split(/\s+/).length < inspectedPages * 10 && OCR) {
    frontText = await ocrPdfFront(path, pages);
    extraction = FULL ? "ocr-full" : "ocr-front";
  }
  return { pages, inspectedPages: extraction === "ocr-front" ? Math.min(pages, 45) : inspectedPages, extraction, wordEstimate: frontText.trim().split(/\s+/).filter(Boolean).length, nodes: candidateNodes(frontText) };
}

async function zipEntries(path) {
  return (await run("unzip", ["-Z1", path])).split("\n").filter(Boolean);
}

async function unzipText(path, entry) {
  return run("unzip", ["-p", path, entry], { optional: true });
}

async function ocrEpubImages(path, imageEntries) {
  const dir = await mkdtemp(join(tmpdir(), "espanol-epub-ocr-"));
  const chapters = [];
  try {
    for (let index = 0; index < imageEntries.length; index += 1) {
      const entry = imageEntries[index];
      const extension = extname(entry) || ".jpg";
      const target = join(dir, `image-${index}${extension}`);
      const bytes = await run("unzip", ["-p", path, entry], { optional: true, encoding: null });
      if (!bytes.length) continue;
      await writeFile(target, bytes);
      const text = cleanMarkup(await run("tesseract", [target, "stdout", "-l", "spa+eng"], { optional: true }));
      if (text.split(/\s+/).length >= 20) chapters.push({ entry, title: text.split("\n")[0].slice(0, 140), text });
    }
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
  return chapters;
}

async function inspectEpub(path, isReader) {
  const entries = await zipEntries(path);
  const htmlEntries = entries.filter((entry) => /\.(xhtml|html|htm)$/i.test(entry));
  const imageEntries = entries.filter((entry) => /\.(png|jpe?g|gif|webp)$/i.test(entry));
  const tocEntry = entries.find((entry) => /(^|\/)(toc\.ncx|toc\.xhtml|toc\.htm|nav\.xhtml|contents\.xhtml|ncx\.ncx)$/i.test(entry));
  const tocText = tocEntry ? cleanMarkup(await unzipText(path, tocEntry)) : "";
  const extracted = [];
  if (FULL) {
    for (const entry of htmlEntries) {
      const text = cleanMarkup(await unzipText(path, entry));
      if (text.split(/\s+/).length >= 20) extracted.push({ entry, title: text.split("\n")[0].slice(0, 140), text });
    }
    const usefulWords = extracted.reduce((total, chapter) => total + chapter.text.split(/\s+/).length, 0);
    if (OCR && isReader && usefulWords < 5_000 && imageEntries.length) extracted.push(...await ocrEpubImages(path, imageEntries));
  }
  const nodes = candidateNodes(`${tocText}\n${extracted.map((chapter) => chapter.text).join("\n")}`);
  const fallbackNodes = [...new Set(extracted.map((chapter) => chapter.title.trim()).filter(Boolean))].map((label, index) => ({ id: `chapter-${index + 1}`, label }));
  const seenNodes = new Set();
  const combinedNodes = [...nodes, ...fallbackNodes].filter((node) => { const key = normalized(node.label); if (!key || seenNodes.has(key)) return false; seenNodes.add(key); return true; }).map((node, index) => ({ ...node, id: `node-${index + 1}` }));
  const chapters = isReader ? extracted : [];
  return { entries: entries.length, htmlEntries: htmlEntries.length, imageEntries: imageEntries.length, extraction: extracted.some((chapter) => /image-\d+/.test(chapter.entry)) ? "epub-html+ocr" : "epub-html", wordEstimate: extracted.reduce((total, chapter) => total + chapter.text.split(/\s+/).length, 0), nodes: combinedNodes, chapters };
}

const diskFiles = (await readdir(SOURCE_ROOT, { withFileTypes: true })).filter((item) => item.isFile() && /\.(pdf|epub)$/i.test(item.name));
const available = diskFiles.map((item) => ({ name: item.name, normalized: normalized(item.name), format: extname(item.name).slice(1).toLowerCase() }));
const used = new Set();
const catalog = [];
const readerPacks = [];

for (const source of sources) {
  const needle = normalized(source.match);
  const match = available
    .filter((file) => !used.has(file.name) && file.format === source.format && file.normalized.includes(needle))
    .sort((left, right) => Number(right.normalized.startsWith(needle)) - Number(left.normalized.startsWith(needle)) || Math.abs(left.normalized.length - needle.length) - Math.abs(right.normalized.length - needle.length))[0];
  if (!match) throw new Error(`Missing source for ${source.id}: ${source.match} (${source.format})`);
  used.add(match.name);
  const path = join(SOURCE_ROOT, match.name);
  const stat = await import("node:fs/promises").then(({ stat }) => stat(path));
  const details = source.format === "pdf" ? await inspectPdf(path) : await inspectEpub(path, source.roles.includes("reader"));
  if (details.chapters?.length) readerPacks.push({ sourceId: source.id, title: source.match, chapters: details.chapters });
  delete details.chapters;
  const record = { id: source.id, fileName: match.name, format: source.format, bytes: stat.size, sha256: await sha256(path), roles: source.roles, ...details };
  catalog.push(record);
  console.log(`${catalog.length}/${sources.length} ${source.id}: ${record.nodes.length} nodes, ${record.extraction}`);
}

await mkdir(resolve(ROOT, ".local"), { recursive: true });
await writeFile(resolve(ROOT, ".local/source-catalog.json"), `${JSON.stringify({ generatedAt: new Date().toISOString(), sourceRoot: SOURCE_ROOT, sources: catalog }, null, 2)}\n`);
if (FULL) {
  await mkdir(resolve(ROOT, "public/private"), { recursive: true });
  await writeFile(resolve(ROOT, "public/private/readers.json"), `${JSON.stringify({ generatedAt: new Date().toISOString(), sources: readerPacks }, null, 2)}\n`);
}
console.log(`INGESTED: ${catalog.length}/${sources.length} documents${FULL ? ` and ${readerPacks.reduce((n, pack) => n + pack.chapters.length, 0)} private reader chapters` : ""}.`);
