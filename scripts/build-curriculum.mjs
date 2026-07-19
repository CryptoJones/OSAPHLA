import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { readerAssignments, sourceIdsForRoles, sources } from "./source-inventory.mjs";
import { sectionKinds, weeks } from "./course-blueprint.mjs";

const ROOT = resolve(import.meta.dirname, "..");
const OUT = resolve(ROOT, "src/data");

function tokens(sentence) {
  return sentence
    .replace(/([,.;:?¿!¡])/g, " $1 ")
    .trim()
    .split(/\s+/);
}

function rotate(array, shift) {
  return array.map((_, index) => array[(index + shift) % array.length]);
}

function questionBank(sectionId, week, sectionIndex) {
  const vocab = rotate(week.vocabulary, sectionIndex);
  const multipleChoice = vocab.map((item, index) => {
    const distractors = [1, 2, 3].map((offset) => vocab[(index + offset) % vocab.length].es);
    return {
      id: `${sectionId}-mc-${index + 1}`,
      type: "multipleChoice",
      prompt: `Choose the best Spanish expression for “${item.en}”.`,
      choices: rotate([item.es, ...distractors], (index + sectionIndex) % 4),
      answer: item.es,
      rationale: `“${item.es}” means “${item.en}” in this section’s context.`,
      objective: week.functions[index % week.functions.length]
    };
  });

  const cloze = vocab.map((item, index) => ({
    id: `${sectionId}-cloze-${index + 1}`,
    type: "cloze",
    prompt: `Complete in Spanish: ${item.en} → ____`,
    answer: item.es,
    accepted: [item.es],
    accentPolicy: week.week < 9 ? "warn" : "required",
    rationale: `The target expression is “${item.es}”.`,
    objective: week.functions[index % week.functions.length]
  }));

  const orderModels = [
    ...week.models,
    `Por ejemplo, ${week.models[0].charAt(0).toLowerCase()}${week.models[0].slice(1)}`,
    `En este contexto, ${week.models[1].charAt(0).toLowerCase()}${week.models[1].slice(1)}`,
    `Según la situación, ${week.models[2].charAt(0).toLowerCase()}${week.models[2].slice(1)}`
  ].slice(0, 8);
  const ordering = orderModels.map((sentence, index) => {
    const answer = tokens(sentence);
    return {
      id: `${sectionId}-order-${index + 1}`,
      type: "ordering",
      prompt: "Put the words and punctuation in a natural Spanish order.",
      tokens: rotate(answer, (index * 2 + sectionIndex + 1) % answer.length),
      answers: [answer],
      rationale: `A natural order is: ${sentence}`,
      objective: week.functions[index % week.functions.length]
    };
  });
  return [...multipleChoice, ...cloze, ...ordering];
}

function storySlice(weekNumber) {
  const start = Math.floor(((weekNumber - 1) * readerAssignments.length) / weeks.length);
  const end = Math.floor((weekNumber * readerAssignments.length) / weeks.length);
  return readerAssignments.slice(start, Math.max(start + 1, end));
}

function contentFor(kind, week, readers) {
  const shared = {
    briefing: [
      { heading: "Operational objective", body: `By the end of this section you can ${week.functions.join(", ")}. The focus is useful performance, not isolated terminology.` },
      { heading: "Language system", body: week.grammar },
      { heading: "Sound and delivery", body: week.pronunciation },
      { heading: "Core principle", body: `Notice meaning first, then form. Retrieve the new language aloud, compare it with the model, and repair one feature at a time.` }
    ],
    patterns: [
      { heading: "Form and meaning", body: week.grammar },
      { heading: "Model set", body: week.models.join(" ") },
      { heading: "Contrastive practice", body: `Change the person, time, number, or level of formality in each model. Preserve the communicative purpose while the grammar changes.` },
      { heading: "Production check", body: `Say one original sentence for each function: ${week.functions.join("; ")}. Then write it and compare the spoken and written forms.` }
    ],
    input: [
      { heading: "Read for the situation", body: week.reading },
      { heading: "Read again for evidence", body: `Identify who acts, what changes, when it happens, and which words establish the relationship between events.` },
      { heading: "Reader assignments", body: readers.map((story) => story.label).join("; ") },
      { heading: "Retell", body: `Without looking back, give the main idea, three supporting details, and one reasonable inference in Spanish.` }
    ],
    culture: [
      { heading: "Cultural lens", body: week.culture },
      { heading: "Avoid the single-story trap", body: `Treat country, region, age, relationship, and setting as variables. Describe the evidence you have without turning one example into a universal rule.` },
      { heading: "Language variation", body: `Recognize regional choices and ask what a form means locally. Use the neutral course model for production until the situation gives you a reason to adapt.` },
      { heading: "Reflection", body: `Compare this context with one you know. Name one similarity, one difference, and one question that would prevent an assumption.` }
    ],
    mission: [
      { heading: "Mission brief", body: week.mission },
      { heading: "Preparation", body: `Select ten useful words, three linking expressions, and two repair phrases. Plan points rather than a memorized paragraph.` },
      { heading: "Performance", body: `Complete the task once for fluency, review the evidence, then repeat it for greater clarity and accuracy.` },
      { heading: "After-action review", body: `Record what succeeded, what blocked communication, and the single change that will matter most on the next attempt.` }
    ]
  };
  return shared[kind];
}

function slidesFor(kind, week, content) {
  return [
    { title: `Week ${week.week}: ${week.title}`, kicker: kind.label, body: week.functions },
    ...content.map((block) => ({ title: block.heading, body: [block.body] })),
    { title: "Model language", body: week.models },
    { title: "Check your readiness", body: ["Explain the core idea.", "Produce an original example.", "Complete the section assessment at 85% or higher."] }
  ];
}

const sections = [];
const modules = weeks.map((week) => {
  const readers = storySlice(week.week);
  const moduleSections = sectionKinds.map((kind, dayIndex) => {
    const number = (week.week - 1) * 5 + dayIndex + 1;
    const id = `w${String(week.week).padStart(2, "0")}-${kind.key}`;
    const content = contentFor(kind.key, week, readers);
    const roleSources = sourceIdsForRoles(...week.roles);
    const sourceRefs = [...new Set([
      ...roleSources.slice(dayIndex, dayIndex + 5),
      ...readers.map((story) => story.sourceId),
      sources[number % sources.length].id
    ])];
    const section = {
      id,
      number,
      week: week.week,
      day: dayIndex + 1,
      phase: week.phase,
      level: week.level,
      kind: kind.key,
      title: `${kind.label}: ${week.title}`,
      subtitle: kind.purpose,
      objectives: week.functions,
      grammar: week.grammar,
      pronunciation: week.pronunciation,
      content,
      vocabulary: week.vocabulary,
      modelSentences: week.models,
      reading: kind.key === "input" ? week.reading : undefined,
      culture: kind.key === "culture" ? week.culture : undefined,
      mission: kind.key === "mission" ? week.mission : undefined,
      readerRefs: kind.key === "input" ? readers : [],
      sourceRefs,
      slides: slidesFor(kind, week, content),
      media: {
        adaptive: true,
        audio: `/media/${id}/narration.mp3`,
        video: `/media/${id}/lesson.mp4`,
        captions: `/media/${id}/captions.vtt`,
        transcript: content.map((block) => `${block.heading}. ${block.body}`).join("\n\n")
      },
      questions: questionBank(id, week, dayIndex),
      masteryThreshold: 0.85,
      estimatedMinutes: kind.key === "mission" ? 55 : kind.key === "input" ? 45 : 35
    };
    sections.push(section);
    return id;
  });
  return {
    week: week.week,
    phase: week.phase,
    level: week.level,
    title: week.title,
    canDo: week.functions,
    sectionIds: moduleSections,
    readerRefs: readers
  };
});

const course = {
  schemaVersion: 1,
  id: "espanol-pan-hispanic-academy",
  title: "Español",
  subtitle: "Accessible Pan-Hispanic Language Academy",
  description: "A 36-week, 180-section, offline-first Spanish course targeting an ILR 2 core with ILR 2+/2+/2 stretch preparation.",
  target: "ILR 2 core; ILR 2+/2+/2 stretch preparation",
  disclaimer: "Course scores and speaking feedback are formative and do not constitute an official ILR rating.",
  modules,
  sections,
  sources: sources.map(({ id, match, format, roles }) => ({ id, title: match, format, roles })),
  readerAssignments,
  generatedAt: new Date().toISOString()
};

await mkdir(OUT, { recursive: true });
await writeFile(resolve(OUT, "course.json"), `${JSON.stringify(course, null, 2)}\n`);
await writeFile(resolve(OUT, "source-manifest.json"), `${JSON.stringify(course.sources, null, 2)}\n`);
console.log(`Generated ${modules.length} weeks, ${sections.length} sections, ${sections.reduce((n, s) => n + s.questions.length, 0)} questions, and ${readerAssignments.length} reader assignments.`);
