# AGENTS.md — per-day curriculum content (weeks 2–36)

## The bug this fixes

Every week's 5 sections (Briefing, Pattern Lab, Input Lab, Culture & Variation, Field
Mission) were showing the **same** vocabulary list, model sentences, and quiz question
pool all week — just reworded framing text around identical content. A learner going
through week 1 day-by-day saw the exact same 8 words and 5 sentences five times in a
row. Reported 2026-07-22; root-caused to `courses/{es,en}/course-blueprint.mjs`, where
each week defines exactly one vocabulary/model set that every section shared.

**Week 1 is fixed in both courses** (commit that added this file). Weeks 2–36 still have
the old shared-set behavior — the code has a fallback so they still build/validate/test
fine, they just haven't been split into distinct per-day content yet. This file is the
recipe for finishing weeks 2–36 exactly the way week 1 was done, so another session/agent
can pick this up without re-deriving the approach.

## How the fix works

`build-curriculum.mjs` now checks each week for an optional `days` array. When present,
`days[dayIndex]` (dayIndex 0–4, matching `sectionKinds` order: briefing, patterns, input,
culture, mission) overrides that section's `vocabulary`, `models`, and `modelTranslations`;
every other week-level field (`grammar`, `functions`, `pronunciation`, `reading`,
`culture`, `mission`, `teaching`...) is untouched and stays shared across the week — that
sharing is correct and intentional, only vocabulary/models were the bug.

Read `courses/es/course-blueprint.mjs` week 1 and `courses/en/course-blueprint.mjs` week 1
for the exact shape to copy. Short version, per week:

```js
days: [
  { vocabulary: V([[...8 pairs...]]), models: [...5 sentences...], modelTranslations: [...5...] }, // briefing
  { vocabulary: V([[...8 pairs...]]), models: [...5 sentences...], modelTranslations: [...5...] }, // patterns
  { vocabulary: V([[...8 pairs...]]), models: [...5 sentences...], modelTranslations: [...5...] }, // input
  { vocabulary: V([[...8 pairs...]]), models: [...5 sentences...], modelTranslations: [...5...] }, // culture
  { vocabulary: V([[...8 pairs...]]), models: [...5 sentences...], modelTranslations: [...5...] }  // mission
]
```

- `V()` at the top of each blueprint file wraps raw `[target, meaning]` pairs. For the ES
  course pairs are `[spanish, english]`; for the EN course pairs are `[english, spanish]`.
- Zod validation (`scripts/curriculum-validation.mjs`) hard-requires **exactly** 8
  vocabulary items and **exactly** 5 model sentences/translations per section — not more,
  not fewer.
- The existing week-level `vocabulary`/`models`/`modelTranslations` fields (outside
  `days`) can stay as-is; once `days` is present they're only used as the schema/legacy
  fallback and no longer feed section 1–5's actual content directly (day 0's own entry
  does). Keeping the legacy fields matching day 0 (briefing) is a reasonable convention
  (that's what week 1 does) but isn't required by the code.

## Content-authoring guidelines (used for week 1, keep consistent)

- **8 distinct words per section, no exact duplicates across a week's 5 sections.**
  Reusing a word inside a *model sentence* (not as a vocabulary item) is fine and even
  good for reinforcement — week 1's mission day model sentences deliberately reuse
  "sílaba tónica" from briefing as a review callback.
- **Match each section's pedagogical purpose** (see `sectionKinds` in each blueprint
  file): briefing = metalanguage/concept intro, patterns = grammar/production practice,
  input = comprehension/reading vocabulary, culture = regional-variation vocabulary,
  mission = task/performance verbs tied to that week's `mission` brief.
- **Mission day works well as a light cumulative review** — pull vocabulary that supports
  actually doing the week's mission task, and it's fine for model sentences to echo
  earlier-day concepts.
- **Briefing can often keep the week's original shared set as-is** (it was usually
  already the right "introduce the core terms" content) — patterns/input/culture/mission
  are where new content is needed.
- Keep ILR-level-appropriate difficulty (check `week.level` for the target week — this
  course runs Novice through Advanced across the 36 weeks, so week 30's vocabulary should
  be harder than week 1's).
- Grammatical correctness matters — this is a real language-learning product. Double
  check gender agreement (el/la, un/una), verb conjugation, and natural phrasing before
  committing a week.

## Special case: weeks 3 and 8

These two weeks use a hand-authored `fixedQuestions()` path in `build-curriculum.mjs`
(grammar-drill questions about gender/adjective agreement, unrelated to `week.vocabulary`)
instead of the generated `questionBank()`. That function is untouched by this work and
needs no changes. **However**, weeks 3 and 8 still show the same displayed
vocabulary/model-sentence duplication bug (the "Active vocabulary" card and "Model set"
content block are separate from the quiz) — they still need a `days` array like every
other week, it just won't affect their `questions` output.

## After editing each week (or a batch of weeks)

```bash
npm run curriculum:build      # regenerates src/data/{es,en}/course.json
npm run curriculum:validate   # Zod schema check — will fail loudly on a wrong count
npm test                      # tests/curriculum.test.ts + curriculum-validation.test.mjs
npm run build                 # full build including typecheck
```

Sanity-check a specific week looks right (adjust week filter as needed):

```bash
node -e "
for (const slug of ['es','en']) {
  const course = require('./src/data/'+slug+'/course.json');
  const week = course.sections.filter(s => s.week === 2); // <- change week number
  const vocabSets = new Set(week.map(s => JSON.stringify(s.vocabulary.map(v=>v.target))));
  console.log(slug, 'week distinct vocab sets (want 5):', vocabSets.size);
}
"
```

## Scope tracker

- [x] Week 1 — done (both courses)
- [ ] Weeks 2–36 — not started

Work through weeks in order or in batches; there's no dependency between weeks, so this
is safe to parallelize across multiple sessions if needed — just don't have two sessions
editing the same week's blueprint entry concurrently.
