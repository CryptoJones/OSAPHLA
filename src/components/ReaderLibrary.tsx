import { useEffect, useMemo, useState } from "react";
import type { Course } from "../types";

interface PrivateChapter { entry: string; title: string; text: string }
interface PrivatePack { sources: Array<{ sourceId: string; title: string; chapters: PrivateChapter[] }> }

export function ReaderLibrary({ course }: { course: Course }) {
  const [pack, setPack] = useState<PrivatePack | null>(null);
  const [selected, setSelected] = useState<{ sourceId: string; chapter: PrivateChapter } | null>(null);
  const [packMissing, setPackMissing] = useState(false);
  useEffect(() => { fetch("/private/readers.json").then((response) => { if (!response.ok) throw new Error(); return response.json(); }).then(setPack).catch(() => setPackMissing(true)); }, []);
  const grouped = useMemo(() => course.readerAssignments.reduce<Record<string, typeof course.readerAssignments>>((result, reader) => {
    (result[reader.sourceId] ??= []).push(reader); return result;
  }, {}), [course.readerAssignments]);

  return <div className="page">
    <header className="page-title"><p className="eyebrow">Extensive reading</p><h1>88 assigned stories, not a synopsis shelf.</h1><p>Each reader entry is assigned to an input lab. When the private source pack is installed, complete extracted text remains on this machine and is available below.</p></header>
    <div className={`private-pack-status ${pack ? "ready" : "missing"}`} role="status"><strong>{pack ? "Private reader pack installed" : packMissing ? "Private reader pack not installed" : "Checking private pack…"}</strong><span>{pack ? `${pack.sources.reduce((count, source) => count + source.chapters.length, 0)} extracted chapters available locally.` : "Run npm run sources:ingest -- --full. The generated pack is ignored by Git."}</span></div>
    <div className="reader-layout">
      <aside aria-label="Reader assignment index">
        {Object.entries(grouped).map(([sourceId, readers]) => <section key={sourceId}><h2>{sourceId}</h2><ol>{readers?.map((reader) => <li key={reader.node}>{reader.label}</li>)}</ol></section>)}
      </aside>
      <section className="private-reader" aria-labelledby="private-reader-title">
        <h2 id="private-reader-title">Private extracted library</h2>
        {pack ? <>{pack.sources.map((source) => <details key={source.sourceId}><summary>{source.title} <span>{source.chapters.length} chapters</span></summary><div className="chapter-buttons">{source.chapters.map((chapter, index) => <button key={`${chapter.entry}-${index}`} onClick={() => setSelected({ sourceId: source.sourceId, chapter })}>{chapter.title || `Chapter ${index + 1}`}</button>)}</div></details>)}
          {selected && <article className="reader-text"><button type="button" className="close-reader" onClick={() => setSelected(null)}>Close text</button><p className="eyebrow">{selected.sourceId}</p><h3>{selected.chapter.title}</h3>{selected.chapter.text.split("\n").map((paragraph, index) => <p lang="es" key={`${paragraph.slice(0, 20)}-${index}`}>{paragraph}</p>)}</article>}</> : <p>The course remains functional without copied source text; the assignments still point to the books in the source directory.</p>}
      </section>
    </div>
  </div>;
}
