import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { validateCourse } from "./curriculum-validation.mjs";

const ROOT = resolve(import.meta.dirname, "..");
const requested = process.argv.includes("--course") ? process.argv[process.argv.indexOf("--course") + 1] : "all";
if (!["es", "en", "all"].includes(requested)) throw new Error(`Unknown course: ${requested}`);
const slugs = requested === "all" ? ["es", "en"] : [requested];

for (const slug of slugs) {
  const course = validateCourse(JSON.parse(await readFile(resolve(ROOT, `src/data/${slug}/course.json`), "utf8")), slug);
  console.log(`VALID ${slug}: ${course.sections.length} sections, ${course.sections.length * 24} questions, ${course.readingAssignments.length} reading assignments.`);
}
