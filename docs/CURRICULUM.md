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
- exactly 24 bank questions, balanced 8/8/8 across MC/cloze/ordering;
- a mastery threshold of 85%.

The 88 reading activities are distributed across all 36 input labs.

`scripts/validate-curriculum.mjs` is a release gate. A generated build that weakens
any of these invariants is invalid even if the web application compiles.
