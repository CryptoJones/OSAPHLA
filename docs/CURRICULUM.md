# Curriculum contract

The generated course is controlled by `scripts/course-blueprint.mjs`. It contains
36 weekly dossiers and five sections per week:

1. Briefing
2. Pattern Lab
3. Input Lab
4. Culture & Variation
5. Field Mission

The progression runs from sound and first contact through present-time interaction,
daily-life domains, narration, pronoun systems, perfect tenses, commands, future,
conditional, subjunctive systems, relative clauses, institutional language, idioms,
regional variation, argument, and an integrated capstone.

Each section must retain:

- at least three observable can-do objectives;
- four or more semantic instruction blocks;
- eight active vocabulary entries and five model sentences;
- adaptive slides, descriptive transcript, and media destinations;
- at least one source reference;
- exactly 24 bank questions, balanced 8/8/8 across MC/cloze/ordering;
- a mastery threshold of 85%.

The 88 reader assignments consist of 20 Lingo Mastery stories, eight Olly Richards
stories, 50 illustrated Easy Spanish stories, eight parallel-text stories, and two
step-by-step stories. They are distributed across all 36 input labs. Their complete
text belongs only in the generated private reader pack.

`scripts/validate-curriculum.mjs` is a release gate. A generated build that weakens
any of these invariants is invalid even if the web application compiles.

## Source traceability

Full ingestion extracts every text-bearing page from PDFs and every HTML content
document from EPUBs. Image-only PDFs and image-dominant graded readers use local
OCR. The private catalog records file hashes, page or entry counts, extraction
method, word estimates, and every distinct structural node detected in each source.

The coverage audit assigns every structural node to the strongest related section
among that source's course references, records shared terms as evidence, and falls
back to deterministic distribution when a terse heading has no useful keywords.
This creates an inspectable curriculum map; it does not place copyrighted textbook
prose in the committed application. Complete extracted reader text stays in the
git-ignored personal reader pack.
