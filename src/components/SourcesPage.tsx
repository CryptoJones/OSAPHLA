import type { Course } from "../types";
import coverageSummary from "../data/coverage-summary.json";

export function SourcesPage({ course }: { course: Course }) {
  return <div className="page">
    <header className="page-title"><p className="eyebrow">Traceability ledger</p><h1>All 31 documents are in scope.</h1><p>This view exposes the curriculum mapping. File hashes, OCR output, extracted text, and private reader content live in the gitignored local source catalog.</p></header>
    <div className="coverage-summary"><strong>31/31</strong><span>sources mapped</span><strong>88</strong><span>reader assignments</span><strong>180</strong><span>assessed sections</span></div>
    <div className="source-list">
      {course.sources.map((source, index) => {
        const sections = course.sections.filter((section) => section.sourceRefs.includes(source.id));
        const readers = course.readerAssignments.filter((reader) => reader.sourceId === source.id);
        const metric = coverageSummary.sources.find((item) => item.sourceId === source.id);
        return <article key={source.id} className="source-card">
          <div className="source-index">{String(index + 1).padStart(2, "0")}</div>
          <div><span className="badge">{source.format.toUpperCase()} · {source.roles.join(" · ")}</span><h2>{source.title}</h2><p><strong>{sections.length}</strong> course sections · <strong>{readers.length}</strong> full reader assignments{metric ? <> · <strong>{metric.sourceNodes.toLocaleString()}</strong> structural nodes · {metric.extraction}</> : null}</p><details><summary>Mapped sections</summary><ul>{sections.map((section) => <li key={section.id}>Week {section.week}, section {section.number}: {section.title}</li>)}</ul></details></div>
        </article>;
      })}
    </div>
  </div>;
}
