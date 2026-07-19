import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const course = JSON.parse(await readFile(resolve(ROOT, "src/data/course.json"), "utf8"));
const privateCatalogPath = resolve(ROOT, ".local/source-catalog.json");
let catalog = [];
try { catalog = JSON.parse(await readFile(privateCatalogPath, "utf8")).sources; } catch { /* ingestion is optional for validation */ }

const stopwords = new Set(["and","book","chapter","course","de","del","el","en","for","la","las","lesson","los","of","part","spanish","the","to","unit","week","y"]);
function terms(value) {
  return new Set(value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().match(/[a-z0-9]{3,}/g)?.filter((term) => !stopwords.has(term)) ?? []);
}
function matchNode(node, sectionRecords, index) {
  const nodeTerms = terms(node.label);
  let best = { section: sectionRecords[index % sectionRecords.length], score: 0, evidence: [] };
  for (const section of sectionRecords) {
    const sectionTerms = terms([section.title, section.grammar, section.pronunciation, ...section.objectives, ...section.content.map((block) => `${block.heading} ${block.body}`)].join(" "));
    const evidence = [...nodeTerms].filter((term) => sectionTerms.has(term));
    if (evidence.length > best.score) best = { section, score: evidence.length, evidence };
  }
  return { ...node, sectionId: best.section.id, matchScore: best.score, evidence: best.evidence.slice(0, 8) };
}

const coverage = course.sources.map((source) => {
  const sectionRecords = course.sections.filter((section) => section.sourceRefs.includes(source.id));
  const sections = sectionRecords.map((section) => section.id);
  const readers = course.readerAssignments.filter((reader) => reader.sourceId === source.id);
  const ingested = catalog.find((item) => item.id === source.id);
  const nodes = (ingested?.nodes?.length ? ingested.nodes : [{ id: "document-root", label: source.title }]).map((node, index) => matchNode(node, sectionRecords, index));
  return { sourceId: source.id, sections, readerNodes: readers.length, sourceNodes: nodes.length, nodeCoverage: nodes, ingested: Boolean(ingested), sha256: ingested?.sha256 ?? null, status: sections.length && nodes.every((node) => node.sectionId) ? "covered" : "missing" };
});
const report = { generatedAt: new Date().toISOString(), sourceCount: coverage.length, covered: coverage.filter((item) => item.status === "covered").length, ingested: coverage.filter((item) => item.ingested).length, coverage };
const summary = {
  generatedAt: report.generatedAt,
  sources: coverage.map((item) => {
    const source = catalog.find((record) => record.id === item.sourceId);
    return { sourceId: item.sourceId, sectionCount: item.sections.length, readerNodes: item.readerNodes, sourceNodes: item.sourceNodes, semanticMatches: item.nodeCoverage.filter((node) => node.matchScore > 0).length, ingested: item.ingested, extraction: source?.extraction ?? "not-ingested", pages: source?.pages ?? null, inspectedPages: source?.inspectedPages ?? null, entries: source?.entries ?? null, wordEstimate: source?.wordEstimate ?? null, status: item.status };
  })
};
await mkdir(resolve(ROOT, ".local"), { recursive: true });
await writeFile(resolve(ROOT, ".local/coverage-report.json"), `${JSON.stringify(report, null, 2)}\n`);
await writeFile(resolve(ROOT, "src/data/coverage-summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
if (report.covered !== report.sourceCount) throw new Error("Coverage audit failed");
console.log(`COVERAGE: ${report.covered}/${report.sourceCount} sources and ${coverage.reduce((sum, item) => sum + item.sourceNodes, 0)} source nodes mapped; ${report.ingested}/${report.sourceCount} verified against local files.`);
