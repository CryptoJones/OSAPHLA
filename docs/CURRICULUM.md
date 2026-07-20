# Curriculum contract

The generated courses are controlled by `courses/es/course-blueprint.mjs` and
`courses/en/course-blueprint.mjs`. Each contains 36 weekly dossiers and five
sections per week. The Spanish path uses English interface and explanatory text;
the English path uses Spanish interface and explanatory text.

1. Briefing
2. Pattern Lab
3. Input Lab
4. Culture & Variation
5. Field Mission

Both progress from sound and first contact through present-time interaction,
daily-life domains, narration, advanced clause systems, institutional language,
regional or global variation, argument, and an integrated capstone. English
production targets General American usage while week 34 builds receptive awareness
of major global English varieties.

Each section must retain:

- at least three observable can-do objectives;
- four or more semantic instruction blocks;
- eight active vocabulary entries and five model sentences;
- adaptive slides, descriptive transcript, and media destinations;
- exactly 24 bank questions, balanced 8/8/8 across MC/cloze/ordering;
- a mastery threshold of 85%.

Each course's 88 reading activities are distributed across all 36 input labs.

`scripts/validate-curriculum.mjs` is a release gate. A generated build that weakens
any of these invariants is invalid even if the web application compiles.
`scripts/validate-bilingual.mjs` additionally verifies target-language content and
native-language meaning across both generated courses.
