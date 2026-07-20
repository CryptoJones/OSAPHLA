import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { sectionKinds as spanishSectionKinds, weeks as spanishBlueprint } from "../courses/es/course-blueprint.mjs";
import { sectionKinds as englishSectionKinds, weeks as englishBlueprint } from "../courses/en/course-blueprint.mjs";

const ROOT = resolve(import.meta.dirname, "..");
const OUT = resolve(ROOT, "src/data");

const SPANISH_MODEL_TRANSLATIONS = [
  ["My name is spelled with five letters.", "The letter h has no sound.", "I listen to and repeat every word.", "Which is the stressed syllable?", "Brief, frequent practice works better."],
  ["Hello, my name is Alex.", "Nice to meet you, Mrs. Rivera.", "What is your name?", "Let me introduce you to my classmate.", "See you tomorrow; have a good day."],
  ["There is a book on the table.", "What is this?", "It is an important question.", "Open your notebooks, please.", "The answers are on page ten."],
  ["I am from the United States.", "My last name is Clark.", "Today is July nineteenth.", "It is a quarter past three.", "What time is the meeting?"],
  ["The pharmacy is near the plaza.", "There is a bank in front of the hotel.", "The museum is closed today.", "Where are the restrooms?", "The meeting is in the blue room."],
  ["I work in the morning and study at night.", "Where do you live?", "We eat together on Fridays.", "She writes in her journal every day.", "Sometimes I drink coffee after eating."],
  ["What do you want to do today?", "When does the bus come?", "I don't know; can you repeat that?", "I have to make a call.", "Why do you say that?"],
  ["My older sister is very kind.", "I know Elena's parents.", "Our family lives in three cities.", "Is this portrait yours?", "I have two brothers and one female cousin."],
  ["I get up at six thirty.", "After getting dressed, I prepare breakfast.", "I am waiting for the train now.", "The children go to bed early.", "What time do you wake up?"],
  ["I like listening to live music.", "Tomás is interested in documentaries.", "Do you prefer going out or staying home?", "We love playing together.", "Hiking is calmer than soccer."],
  ["I would like to try the daily special.", "How much does a kilogram of tomatoes cost?", "For me, a soup without meat.", "The waiter brings us the bill.", "Excuse me, I ordered water, not soda."],
  ["Do you have this shirt in another size?", "Those shoes fit me well.", "That jacket over there is too expensive.", "I want to return this item.", "The price includes taxes."],
  ["Go straight to the plaza.", "Turn left at the second corner.", "Am I going the right way to city hall?", "We got lost near the station.", "The bank is across from the post office."],
  ["The train leaves from platform four.", "We have just arrived at the airport.", "I have a reservation under the name Rivera.", "My luggage is missing.", "We are going to stay three nights."],
  ["My head hurts a lot.", "I have had a fever since yesterday.", "Are you allergic to any medication?", "Call an ambulance.", "He or she fell and hurt an arm."],
  ["It is going to rain on the coast tomorrow.", "It is windy in the highlands.", "If the weather changes, we will return early.", "Lighting fires in the forest is prohibited.", "We are protecting a water source."],
  ["Yesterday I arrived at the office early.", "First we reviewed the report.", "Then they called the supervisor.", "What happened afterward?", "The meeting ended at six."],
  ["I couldn't get in because I lost the key.", "We went to the town by another road.", "There we met the new mayor.", "I learned the truth that same afternoon.", "He or she wanted to help but did not have time."],
  ["There used to be fewer buildings.", "As a girl, I used to play in this plaza.", "It was eight o'clock and raining heavily.", "While we worked, we listened to the radio.", "The city seemed quieter."],
  ["I was walking home when the storm began.", "While everyone was sleeping, the alarm went off.", "There was already little light when we arrived.", "Suddenly, a neighbor opened the door.", "In the end, we solved the problem together."],
  ["I sent him or her the message this morning.", "Someone else received the package.", "Can you show it to me?", "I did not explain the change to them.", "Return the documents to the manager."],
  ["I lost my keys.", "I sent the report to Clara.", "They forgot the appointment.", "Explain it to him or her before the meeting.", "We did not drop the equipment; the support failed."],
  ["We have already completed the first phase.", "The data have not arrived yet.", "Have you ever worked in Chile?", "When he or she called, I had already sent the report.", "The situation has changed recently."],
  ["Turn off the equipment before opening it.", "Do not share that password.", "Make sure you save a copy.", "Let's check the data again.", "It is advisable to avoid this road at night."],
  ["The urban population will increase.", "We will continue measuring the results.", "Where could Marta be now?", "When the study ends, we will publish the data.", "In five years there will be new options."],
  ["I would choose the second option.", "Could you send me the details?", "The change would reduce the risk.", "He or she said that they would arrive the following day.", "On the other hand, that plan would cost too much."],
  ["I recommend that you review the data.", "It is necessary for the residents to participate.", "I am glad you are here.", "The director asks us to arrive early.", "I hope they find a fair solution."],
  ["I doubt that the figure is correct.", "It will probably rain tonight.", "We are leaving early so that there is enough time.", "We will not sign unless they change the clause.", "Call me as soon as you arrive."],
  ["We are looking for someone who has experience.", "I know the person who directs the project.", "I need a place that is near the subway.", "That is what worries me.", "The author whose book won the prize will give a talk."],
  ["The measure was approved by the council.", "The results were published yesterday.", "We work to improve access.", "The service closed because of a lack of funding.", "Identification is required to enter."],
  ["The second option is much more viable.", "The least clear report was the first one.", "The project is going very well.", "That figure must be treated with caution.", "The analysis was exactly right; however, evidence is still lacking."],
  ["According to the technician, the network is already working.", "We communicate through a secure channel.", "The director said they would extend the deadline.", "Attached you will find the requested report.", "Regarding the incident, two pieces of information are missing."],
  ["The source states that the reform expanded rights.", "Others maintain that inequality continued.", "When the government changed, many people had already emigrated.", "Although there is consensus about the facts, their meaning is debated.", "The testimony provides a personal perspective."],
  ["Do you have time tomorrow?", "You all can enter here.", "You all wait for the bus on that corner.", "In Mexico, camión can mean bus.", "I did not understand that word; what does it mean here?"],
  ["The main argument is supported by three findings.", "It is worth noting that the sample was small.", "Although the proposal has advantages, its scope is limited.", "The most likely consequence would be a gradual increase.", "In conclusion, I recommend a controlled trial."],
  ["Allow me to clarify what I understood.", "Before acting, we must verify the source.", "I can summarize both positions and justify my recommendation.", "I adapt to the register without imitating an accent.", "My maintenance plan combines reading, listening, conversation, and writing."]
];

const SPANISH_READING_TRANSLATIONS = [
  "Ana opens her notebook. She listens to a word, marks the stressed syllable, and repeats it. She is not seeking perfection; she seeks one clear improvement each day.",
  "Lucía arrives early. She greets the receptionist with good morning and uses the formal usted. Later she meets Mateo, another student, and they both use the familiar tú.",
  "There are twenty chairs and ten tables in the classroom. The teacher opens a book and writes a question. The students look for the answer in their notebooks.",
  "The form asks for the first name, last names, and country of origin. The appointment is Tuesday at nine thirty. Elena confirms the date and saves the contact number.",
  "The information center is next to the entrance. There are free maps on the counter, but the cafeteria is closed. The restrooms are at the end of the hallway.",
  "Raúl lives near his workplace. He walks to the office, eats with his coworkers, and studies English at night. On weekends he writes to his family.",
  "Marta wants to visit the market, but she does not know when it opens. She calls information, asks about the schedule, and asks them to repeat the address.",
  "Inés's family is large and lives in several countries. Her older female cousin is a doctor, her brothers are students, and her best friend takes part in every celebration.",
  "Julia normally wakes up early, but today her alarm does not work. She is getting dressed quickly while her partner prepares coffee and calls a taxi.",
  "Camila loves movies, but Diego is more interested in sports. They look for an activity they can enjoy together and choose an outdoor festival.",
  "At the market, Sara compares prices and buys fresh vegetables. Later she orders the daily special, asks about the ingredients, and explains that she cannot eat nuts.",
  "Nora needs clothes for an interview. This jacket fits her well, but it is expensive. She finds a cheaper one and asks whether she can return it with the receipt.",
  "A visitor is looking for the museum but takes the wrong street. A neighbor tells him to continue straight, cross the plaza, and turn after the post office.",
  "Omar's flight arrives late, and he misses the last bus. He calls the hotel to keep the reservation and asks how to get there using shared transportation.",
  "During a hike, Luis falls and hurts his arm. His friend calls emergency services, describes the location, and explains that he is conscious but in a great deal of pain.",
  "The forecast announces heavy rain and wind in the mountains. The group changes its route, carries more water, and avoids an area closed because of wildfire risk.",
  "Yesterday a power outage affected the neighborhood. First the neighbors called the electric company. Then they organized lights and food for the older residents.",
  "The team wanted to cross the bridge but could not. It took another route and learned there that a storm had damaged the road. In the end, it had to return.",
  "When Teresa was a child, her street had few cars, and everyone knew the neighbors. Every afternoon she played in the plaza while her grandparents talked outside.",
  "Elena was returning from work when she saw smoke. While she called emergency services, two neighbors helped a family get out. The firefighters arrived and controlled the fire.",
  "The office sent two packages, but the courier delivered them to the wrong recipients. The manager explained the error to them and asked them to return the packages.",
  "Julia accidentally deleted an important file. She reported it to the team, they recovered a copy, and they documented the solution so that it would not happen again.",
  "The project has progressed, but it still has not received final approval. The team had already corrected the errors when a new request arrived.",
  "The instructions require turning off the system, saving a copy, and checking the connection. A technician skips the second step, and the team must repeat the process.",
  "During the next decade, several cities will expand public transportation. There will probably be disagreements, but the projects will continue moving forward.",
  "The first proposal would be fast, but it would increase the risk. The second would take longer and cost less. The committee should compare the long-term effects.",
  "The residents demand that the city repair the bridge. The engineer recommends closing it temporarily and hopes the work ends before the rainy season.",
  "The report may contain errors. Before the council votes, the analysts will review the sources so that everyone understands the risks.",
  "The organization is looking for a person who knows the region and can work immediately. It has already interviewed a candidate who lived there for five years.",
  "The new rule was approved by the city council to reduce traffic. Deliveries will be permitted in the morning, and the results will be measured for six months.",
  "The team celebrated because the project was going very well, but an analyst asked them to treat the figures with caution. Her caution proved exactly right when an error appeared.",
  "During the meeting, the technical team explained that the interruption did not affect the files. The director requested a report and announced that they would review the protocol.",
  "Two sources describe the same protest. The newspaper emphasizes the political change, while a testimony recalls the everyday fear. Both perspectives contribute different facts.",
  "Three speakers arrange the same trip. One person takes the camión, another waits for the guagua, and another checks the autobús schedule. The vehicle is similar; the word changes.",
  "A study proposes expanding a public service. The data show benefits, although the sample is limited. The author recommends a regional trial before adopting the measure nationwide.",
  "At the end of the course, the goal is not to know every word. The goal is to understand, act, repair errors, and keep learning. Proficiency is maintained through frequent contact and increasingly demanding tasks."
];

function tokens(sentence) {
  return sentence
    .replace(/([,.;:?¿!¡])/g, " $1 ")
    .trim()
    .split(/\s+/);
}

function rotate(array, shift) {
  return array.map((_, index) => array[(index + shift) % array.length]);
}

function meaningPrompt(item, courseSlug) {
  const hasDefiniteArticle = courseSlug === "es" && /^(el|la|los|las)\s/i.test(item.target);
  return hasDefiniteArticle && !/^the\s/i.test(item.meaning) ? `the ${item.meaning}` : item.meaning;
}

function fixedQuestions(sectionId, week) {
  const make = (type, rows) => rows.map((row, index) => ({ id: `${sectionId}-${type}-${index + 1}`, type, ...row, objective: week.functions[index % week.functions.length] }));
  if (week.week === 3) {
    const multipleChoice = make("multipleChoice", [
      { prompt: "Which form correctly means “the word”?", choices: ["la palabra", "el palabra", "una palabra", "las palabra"], answer: "la palabra", rationale: "Palabra is feminine singular, so its definite article is la." },
      { prompt: "What is the best way to learn a new Spanish noun?", choices: ["With its article", "Without its article", "Only in English", "Only by its final letter"], answer: "With its article", rationale: "Learning la palabra or el libro stores the noun's gender with the noun." },
      { prompt: "Which phrase correctly means “the books”?", choices: ["los libros", "las libros", "el libros", "unos libro"], answer: "los libros", rationale: "Libro is masculine; both article and noun must be plural: los libros." },
      { prompt: "Which phrase correctly means “a table”?", choices: ["una mesa", "un mesa", "la mesa", "unas mesa"], answer: "una mesa", rationale: "Mesa is feminine singular, so the matching indefinite article is una." },
      { prompt: "Which statement about noun endings is accurate?", choices: ["They are useful clues with exceptions", "Every -a noun is feminine", "Every -o noun is masculine", "Endings never provide clues"], answer: "They are useful clues with exceptions", rationale: "Patterns help, but nouns such as el día, el problema, and la mano show why the article must be learned." },
      { prompt: "Which phrase has correct gender and number agreement?", choices: ["las palabras nuevas", "los palabras nuevos", "la palabras nueva", "las palabras nuevo"], answer: "las palabras nuevas", rationale: "Article, noun, and adjective are all feminine plural." },
      { prompt: "What does grammatical gender classify?", choices: ["Words and their agreement", "A person's identity", "Only living things", "The speaker's gender"], answer: "Words and their agreement", rationale: "Grammatical gender is a property of nouns and related words; it does not necessarily describe sex or identity." },
      { prompt: "Which is a correctly learned noun unit?", choices: ["el libro", "libro alone", "the libro", "el la libro"], answer: "el libro", rationale: "Store a noun together with its article so its gender is available when you use it." }
    ]);
    const cloze = make("cloze", [
      { prompt: "Complete “the word”: ___ palabra", answer: "la", accepted: ["la"], accentPolicy: "warn", rationale: "Palabra is feminine singular, so use la." },
      { prompt: "Complete “the book”: ___ libro", answer: "el", accepted: ["el"], accentPolicy: "warn", rationale: "Libro is masculine singular, so use el." },
      { prompt: "Make la palabra plural: ___ palabras", answer: "las", accepted: ["las"], accentPolicy: "warn", rationale: "The feminine plural definite article is las." },
      { prompt: "Make el libro plural: ___ libros", answer: "los", accepted: ["los"], accentPolicy: "warn", rationale: "The masculine plural definite article is los." },
      { prompt: "Complete “a table”: ___ mesa", answer: "una", accepted: ["una"], accentPolicy: "warn", rationale: "The feminine singular indefinite article is una." },
      { prompt: "Complete “some books”: ___ libros", answer: "unos", accepted: ["unos"], accentPolicy: "warn", rationale: "The masculine plural indefinite article is unos." },
      { prompt: "Complete the agreeing phrase: una palabra ___ (new)", answer: "nueva", accepted: ["nueva"], accentPolicy: "warn", rationale: "Nueva agrees with the feminine singular noun palabra." },
      { prompt: "Complete the agreeing phrase: los libros ___ (new)", answer: "nuevos", accepted: ["nuevos"], accentPolicy: "warn", rationale: "Nuevos agrees with the masculine plural noun libros." }
    ]);
    const phrases = [["La palabra es nueva .", "The word is new."], ["El libro es nuevo .", "The book is new."], ["Las palabras son nuevas .", "The words are new."], ["Los libros son nuevos .", "The books are new."], ["Hay una mesa grande .", "There is a large table."], ["Hay unos libros nuevos .", "There are some new books."], ["Es una pregunta importante .", "It is an important question."], ["Las respuestas están aquí .", "The answers are here."]];
    const ordering = make("ordering", phrases.map(([phrase, meaning], index) => { const answer = tokens(phrase); return { prompt: `English meaning: “${meaning}” Build the Spanish phrase with correct gender and number agreement.`, tokens: rotate(answer, index + 1), answers: [answer], rationale: `The agreeing phrase is: ${phrase} It means: ${meaning}` }; }));
    return [...multipleChoice, ...cloze, ...ordering];
  }
  if (week.week === 8) {
    const multipleChoice = make("multipleChoice", [
      { prompt: "Choose the correctly agreeing phrase.", choices: ["una amiga alta", "una amiga alto", "un amiga alta", "una amigas altas"], answer: "una amiga alta", rationale: "Article, noun, and adjective are feminine singular." },
      { prompt: "Choose the masculine plural phrase.", choices: ["unos amigos altos", "unas amigas altas", "un amigo alto", "unos amigos alta"], answer: "unos amigos altos", rationale: "Unos, amigos, and altos are masculine plural." },
      { prompt: "Which adjective commonly keeps the same singular form for both genders?", choices: ["amable", "alto", "nuevo", "pequeño"], answer: "amable", rationale: "Many adjectives ending in -e use one singular form: amigo amable and amiga amable." },
      { prompt: "Choose the correct plural of una hermana amable.", choices: ["unas hermanas amables", "unos hermanos amables", "unas hermanas amable", "una hermanas amables"], answer: "unas hermanas amables", rationale: "Every variable word must be plural; amable becomes amables." },
      { prompt: "What controls an adjective's agreement?", choices: ["The noun it describes", "The speaker", "The verb tense", "The sentence length"], answer: "The noun it describes", rationale: "The adjective matches its noun in gender and number." },
      { prompt: "Which phrase correctly describes two female friends?", choices: ["dos amigas simpáticas", "dos amigas simpáticos", "dos amigos simpáticas", "dos amiga simpática"], answer: "dos amigas simpáticas", rationale: "Both noun and adjective are feminine plural." },
      { prompt: "Where do descriptive adjectives usually appear in a neutral phrase?", choices: ["After the noun", "Before every noun", "Before the article", "Only at sentence end"], answer: "After the noun", rationale: "The usual neutral position is after the noun, though common exceptions exist." },
      { prompt: "Choose the phrase with correct agreement.", choices: ["la familia grande", "la familia grandes", "el familia grande", "la familia grandeos"], answer: "la familia grande", rationale: "Grande has one singular form and agrees in number with familia." }
    ]);
    const cloze = make("cloze", [
      { prompt: "Complete: una amiga ___ (tall)", answer: "alta", accepted: ["alta"], accentPolicy: "required", rationale: "Alta is feminine singular." },
      { prompt: "Complete: un amigo ___ (tall)", answer: "alto", accepted: ["alto"], accentPolicy: "required", rationale: "Alto is masculine singular." },
      { prompt: "Complete: unas amigas ___ (kind)", answer: "amables", accepted: ["amables"], accentPolicy: "required", rationale: "Amable does not change for gender, but it does become plural." },
      { prompt: "Complete: los padres ___ (young)", answer: "jóvenes", accepted: ["jóvenes"], accentPolicy: "required", rationale: "Jóvenes is the plural of joven and retains its written accent." },
      { prompt: "Complete: la hermana ___ (older)", answer: "mayor", accepted: ["mayor"], accentPolicy: "required", rationale: "Mayor uses the same singular form with masculine and feminine nouns." },
      { prompt: "Complete: dos hermanas ___ (older)", answer: "mayores", accepted: ["mayores"], accentPolicy: "required", rationale: "Mayores agrees with the plural noun hermanas." },
      { prompt: "Complete: nuestra familia es ___ (large)", answer: "grande", accepted: ["grande"], accentPolicy: "required", rationale: "Grande uses the same singular form for both genders." },
      { prompt: "Complete: nuestras familias son ___ (large)", answer: "grandes", accepted: ["grandes"], accentPolicy: "required", rationale: "Grandes agrees with the plural noun familias." }
    ]);
    const phrases = [["Mi hermana mayor es amable .", "My older sister is kind."], ["Mis hermanas mayores son amables .", "My older sisters are kind."], ["Un amigo alto vive aquí .", "A tall male friend lives here."], ["Una amiga alta vive aquí .", "A tall female friend lives here."], ["La familia grande celebra junta .", "The large family celebrates together."], ["Las familias grandes celebran juntas .", "The large families celebrate together."], ["Tengo dos hermanos jóvenes .", "I have two young brothers."], ["Ella es una persona amable .", "She is a kind person."]];
    const ordering = make("ordering", phrases.map(([phrase, meaning], index) => { const answer = tokens(phrase); return { prompt: `English meaning: “${meaning}” Build the Spanish phrase with correct adjective agreement.`, tokens: rotate(answer, index + 1), answers: [answer], rationale: `The agreeing phrase is: ${phrase} It means: ${meaning}` }; }));
    return [...multipleChoice, ...cloze, ...ordering];
  }
  return null;
}

function questionBank(sectionId, week, sectionIndex, config) {
  const fixed = config.slug === "es" ? fixedQuestions(sectionId, week) : null;
  if (fixed) return fixed;
  const vocab = rotate(week.vocabulary, sectionIndex);
  const multipleChoice = vocab.map((item, index) => {
    const distractors = [1, 2, 3].map((offset) => vocab[(index + offset) % vocab.length].target);
    return {
      id: `${sectionId}-mc-${index + 1}`,
      type: "multipleChoice",
      prompt: config.copy.multipleChoicePrompt(meaningPrompt(item, config.slug)),
      choices: rotate([item.target, ...distractors], (index + sectionIndex) % 4),
      answer: item.target,
      rationale: config.copy.vocabularyRationale(item.target, meaningPrompt(item, config.slug)),
      objective: week.functions[index % week.functions.length]
    };
  });

  const cloze = vocab.map((item, index) => ({
    id: `${sectionId}-cloze-${index + 1}`,
    type: "cloze",
    prompt: config.copy.clozePrompt(meaningPrompt(item, config.slug)),
    answer: item.target,
    accepted: [item.target],
    accentPolicy: config.slug === "en" ? "english" : week.week < 9 ? "warn" : "required",
    rationale: config.copy.targetRationale(item.target),
    objective: week.functions[index % week.functions.length]
  }));

  const orderModels = [...week.models, ...config.copy.extendedTargets(week.models)].slice(0, 8);
  const orderMeanings = [...week.modelTranslations, ...config.copy.extendedMeanings(week.modelTranslations)].slice(0, 8);
  const ordering = orderModels.map((sentence, index) => {
    const answer = tokens(sentence);
    return {
      id: `${sectionId}-order-${index + 1}`,
      type: "ordering",
      prompt: config.copy.orderingPrompt(orderMeanings[index]),
      tokens: rotate(answer, (index * 2 + sectionIndex + 1) % answer.length),
      answers: [answer],
      rationale: config.copy.orderingRationale(sentence, orderMeanings[index]),
      objective: week.functions[index % week.functions.length]
    };
  });
  return [...multipleChoice, ...cloze, ...ordering];
}

function readingSlice(readingAssignments, weekNumber, weekCount) {
  const start = Math.floor(((weekNumber - 1) * readingAssignments.length) / weekCount);
  const end = Math.floor((weekNumber * readingAssignments.length) / weekCount);
  return readingAssignments.slice(start, Math.max(start + 1, end));
}

function contentFor(kind, week, readings, config) {
  const teaching = week.teaching ?? [];
  const c = config.copy;
  const shared = {
    briefing: [
      { heading: c.operationalObjective, body: c.objectiveBody(week.functions) },
      { heading: c.languageSystem, body: week.grammar },
      { heading: c.soundAndDelivery, body: week.pronunciation },
      { heading: c.corePrinciple, body: c.corePrincipleBody },
      ...teaching
    ],
    patterns: [
      { heading: c.formAndMeaning, body: week.grammar },
      { heading: c.modelSet, body: week.models.join(" "), translation: week.modelTranslations.join(" ") },
      { heading: c.contrastivePractice, body: c.contrastivePracticeBody },
      { heading: c.productionCheck, body: c.productionCheckBody(week.functions) },
      ...teaching
    ],
    input: [
      { heading: c.readForSituation, body: week.reading, translation: week.readingTranslation },
      { heading: c.readForEvidence, body: c.readForEvidenceBody },
      { heading: c.readingActivities, body: readings.map((activity) => activity.label).join("; ") },
      { heading: c.retell, body: c.retellBody }
    ],
    culture: [
      { heading: c.culturalLens, body: week.culture },
      { heading: c.singleStory, body: c.singleStoryBody },
      { heading: c.languageVariation, body: c.languageVariationBody },
      { heading: c.reflection, body: c.reflectionBody }
    ],
    mission: [
      { heading: c.missionBrief, body: week.mission },
      { heading: c.preparation, body: c.preparationBody },
      { heading: c.performance, body: c.performanceBody },
      { heading: c.afterAction, body: c.afterActionBody }
    ]
  };
  return shared[kind];
}

function slidesFor(kind, week, content, config) {
  return [
    { title: config.copy.weekTitle(week.week, week.title), kicker: kind.label, body: week.functions },
    ...content.map((block) => ({ title: block.heading, body: [block.body, block.translation].filter(Boolean) })),
    { title: config.copy.modelLanguage, body: week.models.map((model, index) => `${model} — ${week.modelTranslations[index]}`) },
    { title: config.copy.checkReadiness, body: config.copy.readinessItems }
  ];
}

const shared = {
  target: "ILR 2 core; ILR 2+/2+/2 stretch preparation",
  disclaimer: {
    es: "Course scores and speaking feedback are formative and do not constitute an official ILR rating.",
    en: "Las puntuaciones y la retroalimentación oral son formativas y no constituyen una calificación ILR oficial."
  }
};

const englishCopy = {
  operationalObjective: "Operational objective", languageSystem: "Language system", soundAndDelivery: "Sound and delivery", corePrinciple: "Core principle",
  objectiveBody: (items) => `By the end of this section you can ${items.join(", ")}. The focus is useful performance, not isolated terminology.`,
  corePrincipleBody: "Notice meaning first, then form. Retrieve the new language aloud, compare it with the model, and repair one feature at a time.",
  formAndMeaning: "Form and meaning", modelSet: "Model set", contrastivePractice: "Contrastive practice", productionCheck: "Production check",
  contrastivePracticeBody: "Change the person, time, number, or level of formality in each model. Preserve the communicative purpose while the grammar changes.",
  productionCheckBody: (items) => `Say one original sentence for each function: ${items.join("; ")}. Then write it and compare the spoken and written forms.`,
  readForSituation: "Read for the situation", readForEvidence: "Read again for evidence", readingActivities: "Reading activities", retell: "Retell",
  readForEvidenceBody: "Identify who acts, what changes, when it happens, and which words establish the relationship between events.",
  retellBody: "Without looking back, give the main idea, three supporting details, and one reasonable inference in Spanish.",
  culturalLens: "Cultural lens", singleStory: "Avoid the single-story trap", languageVariation: "Language variation", reflection: "Reflection",
  singleStoryBody: "Treat country, region, age, relationship, and setting as variables. Describe the evidence you have without turning one example into a universal rule.",
  languageVariationBody: "Recognize regional choices and ask what a form means locally. Use the neutral course model for production until the situation gives you a reason to adapt.",
  reflectionBody: "Compare this context with one you know. Name one similarity, one difference, and one question that would prevent an assumption.",
  missionBrief: "Mission brief", preparation: "Preparation", performance: "Performance", afterAction: "After-action review",
  preparationBody: "Select ten useful words, three linking expressions, and two repair phrases. Plan points rather than a memorized paragraph.",
  performanceBody: "Complete the task once for fluency, review the evidence, then repeat it for greater clarity and accuracy.",
  afterActionBody: "Record what succeeded, what blocked communication, and the single change that will matter most on the next attempt.",
  weekTitle: (week, title) => `Week ${week}: ${title}`, modelLanguage: "Model language", checkReadiness: "Check your readiness",
  readinessItems: ["Explain the core idea.", "Produce an original example.", "Complete the section assessment at 85% or higher."],
  multipleChoicePrompt: (meaning) => `Choose the best Spanish expression for “${meaning}”.`,
  vocabularyRationale: (target, meaning) => `“${target}” means “${meaning}” in this section's context.`,
  clozePrompt: (meaning) => `Complete in Spanish: ${meaning} → ____`, targetRationale: (target) => `The target expression is “${target}”.`,
  extendedTargets: (items) => [`Por ejemplo, ${items[0].charAt(0).toLowerCase()}${items[0].slice(1)}`, `En este contexto, ${items[1].charAt(0).toLowerCase()}${items[1].slice(1)}`, `Según la situación, ${items[2].charAt(0).toLowerCase()}${items[2].slice(1)}`],
  extendedMeanings: (items) => [`For example, ${items[0].charAt(0).toLowerCase()}${items[0].slice(1)}`, `In this context, ${items[1].charAt(0).toLowerCase()}${items[1].slice(1)}`, `According to the situation, ${items[2].charAt(0).toLowerCase()}${items[2].slice(1)}`],
  orderingPrompt: (meaning) => `English meaning: “${meaning}” Put the Spanish words and punctuation in a natural order.`,
  orderingRationale: (target, meaning) => `A natural order is: ${target} It means: ${meaning}`
};

const spanishCopy = {
  operationalObjective: "Objetivo operativo", languageSystem: "Sistema lingüístico", soundAndDelivery: "Sonido y producción", corePrinciple: "Principio central",
  objectiveBody: (items) => `Al terminar esta sección podrás ${items.join(", ")}. El objetivo es el desempeño útil, no la terminología aislada.`,
  corePrincipleBody: "Observa primero el significado y después la forma. Recupera el inglés en voz alta, compáralo con el modelo y corrige un rasgo a la vez.",
  formAndMeaning: "Forma y significado", modelSet: "Conjunto de modelos", contrastivePractice: "Práctica contrastiva", productionCheck: "Comprobación de producción",
  contrastivePracticeBody: "Cambia la persona, el tiempo, el número o el grado de formalidad de cada modelo sin perder su propósito comunicativo.",
  productionCheckBody: (items) => `Di una oración original para cada función: ${items.join("; ")}. Después escríbela y compara las formas oral y escrita.`,
  readForSituation: "Lee para entender la situación", readForEvidence: "Lee de nuevo para buscar evidencia", readingActivities: "Actividades de lectura", retell: "Reconstrucción",
  readForEvidenceBody: "Identifica quién actúa, qué cambia, cuándo ocurre y qué palabras establecen la relación entre los acontecimientos.",
  retellBody: "Sin mirar el texto, expresa la idea principal, tres detalles y una inferencia razonable en inglés.",
  culturalLens: "Lente cultural", singleStory: "Evita una sola historia", languageVariation: "Variación lingüística", reflection: "Reflexión",
  singleStoryBody: "Considera país, región, edad, relación y situación como variables. Describe la evidencia sin convertir un ejemplo en regla universal.",
  languageVariationBody: "Reconoce variantes y pregunta qué significa una forma localmente. Usa el modelo estadounidense del curso hasta que la situación justifique adaptarlo.",
  reflectionBody: "Compara este contexto con uno que conozcas. Indica una semejanza, una diferencia y una pregunta que evite una suposición.",
  missionBrief: "Instrucciones de la misión", preparation: "Preparación", performance: "Ejecución", afterAction: "Revisión posterior",
  preparationBody: "Selecciona diez palabras útiles, tres conectores y dos frases de reparación. Planifica ideas, no un párrafo memorizado.",
  performanceBody: "Completa la tarea una vez para ganar fluidez, revisa la evidencia y repítela con más claridad y precisión.",
  afterActionBody: "Registra qué funcionó, qué bloqueó la comunicación y cuál será el cambio más importante para el próximo intento.",
  weekTitle: (week, title) => `Semana ${week}: ${title}`, modelLanguage: "Lenguaje modelo", checkReadiness: "Comprueba tu preparación",
  readinessItems: ["Explica la idea central.", "Produce un ejemplo original.", "Completa la evaluación con un 85 % o más."],
  multipleChoicePrompt: (meaning) => `Elige la mejor expresión en inglés para “${meaning}”.`,
  vocabularyRationale: (target, meaning) => `“${target}” significa “${meaning}” en el contexto de esta sección.`,
  clozePrompt: (meaning) => `Completa en inglés: ${meaning} → ____`, targetRationale: (target) => `La expresión meta es “${target}”.`,
  extendedTargets: (items) => [`For example, ${items[0].charAt(0).toLowerCase()}${items[0].slice(1)}`, `In this context, ${items[1].charAt(0).toLowerCase()}${items[1].slice(1)}`, `According to the situation, ${items[2].charAt(0).toLowerCase()}${items[2].slice(1)}`],
  extendedMeanings: (items) => [`Por ejemplo: ${items[0].charAt(0).toLowerCase()}${items[0].slice(1)}`, `En este contexto: ${items[1].charAt(0).toLowerCase()}${items[1].slice(1)}`, `Según la situación: ${items[2].charAt(0).toLowerCase()}${items[2].slice(1)}`],
  orderingPrompt: (meaning) => `Significado en español: “${meaning}” Ordena las palabras y la puntuación en inglés.`,
  orderingRationale: (target, meaning) => `Un orden natural es: ${target} Significa: ${meaning}`
};

const configs = {
  es: {
    slug: "es", id: "espanol-pan-hispanic-academy", targetLocale: "es-419", instructionLocale: "en-US", flags: ["🇲🇽", "🇪🇸", "🇵🇪", "🇨🇴", "🇦🇷"],
    title: "OSAPHLA · Spanish", subtitle: "Spanish for English speakers", description: "An accessible, 36-week, 180-section, offline-first Spanish course targeting an ILR 2 core with ILR 2+/2+/2 stretch preparation.",
    weeks: spanishBlueprint.map((week, index) => ({ ...week, vocabulary: week.vocabulary.map((item) => ({ ...item, target: item.es, meaning: meaningPrompt({ target: item.es, meaning: item.en }, "es") })), modelTranslations: SPANISH_MODEL_TRANSLATIONS[index], readingTranslation: SPANISH_READING_TRANSLATIONS[index] })),
    sectionKinds: spanishSectionKinds, copy: englishCopy,
    readingFocuses: [
      { focus: "Main idea", instructions: "Read once for the overall situation. Read again and state the main idea in one sentence without translating every word.", prompts: ["Who or what is this passage mainly about?", "What is the central action or situation?", "Summarize the passage in one English sentence, then try one Spanish sentence."] },
      { focus: "Evidence and detail", instructions: "Read for evidence. Locate the exact words that establish people, actions, place, time, and change.", prompts: ["Identify three details stated directly in the passage.", "Which words establish when or where the situation occurs?", "What reasonable inference can you make, and which detail supports it?"] },
      { focus: "Language and retelling", instructions: "Notice reusable language, then retell the passage from memory. Preserve the meaning even if your wording changes.", prompts: ["Choose three useful words or phrases and explain them in context.", "Retell the events in order without looking back.", "Change one person, time, or place and retell the adapted version."] }
    ],
    readingLabel: (number) => `Reading activity ${number}`
  },
  en: {
    slug: "en", id: "english-for-spanish-speakers", targetLocale: "en-US", instructionLocale: "es-419", flags: ["🇺🇸", "🇬🇧"],
    title: "OSAPHLA · English", subtitle: "Inglés para hispanohablantes", description: "Un curso de inglés accesible, sin conexión, de 36 semanas y 180 secciones, con núcleo ILR 2 y preparación avanzada ILR 2+/2+/2.",
    weeks: englishBlueprint, sectionKinds: englishSectionKinds, copy: spanishCopy,
    readingFocuses: [
      { focus: "Idea principal", instructions: "Lee una vez para entender la situación general. Lee de nuevo y expresa la idea principal sin traducir cada palabra.", prompts: ["¿De quién o de qué trata principalmente?", "¿Cuál es la acción o situación central?", "Resume el texto en una oración en español y después intenta una en inglés."] },
      { focus: "Evidencia y detalle", instructions: "Busca las palabras exactas que establecen personas, acciones, lugar, tiempo y cambio.", prompts: ["Identifica tres detalles expresados directamente.", "¿Qué palabras establecen cuándo o dónde ocurre?", "¿Qué inferencia razonable puedes hacer y qué detalle la respalda?"] },
      { focus: "Lenguaje y reconstrucción", instructions: "Observa expresiones reutilizables y reconstruye el texto de memoria sin cambiar su significado.", prompts: ["Elige tres expresiones útiles y explícalas en contexto.", "Cuenta los acontecimientos en orden sin mirar.", "Cambia una persona, un momento o un lugar y cuenta la versión adaptada."] }
    ],
    readingLabel: (number) => `Actividad de lectura ${number}`
  }
};

async function buildCourse(config) {
  const readingAssignments = Array.from({ length: 88 }, (_, index) => ({ id: `reading-${String(index + 1).padStart(2, "0")}`, label: config.readingLabel(index + 1) }));
  const sections = [];
  const modules = config.weeks.map((week) => {
    const inputSectionId = `w${String(week.week).padStart(2, "0")}-input`;
    const readings = readingSlice(readingAssignments, week.week, config.weeks.length).map((assignment, index) => Object.assign(assignment, { title: `${week.title}: ${config.readingFocuses[index].focus}`, week: week.week, sectionId: inputSectionId, passage: week.reading, passageTranslation: week.readingTranslation, ...config.readingFocuses[index] }));
    const moduleSections = config.sectionKinds.map((kind, dayIndex) => {
      const number = (week.week - 1) * 5 + dayIndex + 1;
      const id = `w${String(week.week).padStart(2, "0")}-${kind.key}`;
      const content = contentFor(kind.key, week, readings, config);
      const section = {
        id, number, week: week.week, day: dayIndex + 1, phase: week.phase, level: week.level, kind: kind.key,
        title: `${kind.label}: ${week.title}`, subtitle: kind.purpose, objectives: week.functions, grammar: week.grammar, pronunciation: week.pronunciation,
        content, vocabulary: week.vocabulary.map(({ target, meaning }) => ({ target, meaning })), modelSentences: week.models, modelTranslations: week.modelTranslations,
        reading: kind.key === "input" ? week.reading : undefined, readingTranslation: kind.key === "input" ? week.readingTranslation : undefined,
        culture: kind.key === "culture" ? week.culture : undefined, mission: kind.key === "mission" ? week.mission : undefined,
        readingAssignments: kind.key === "input" ? readings : [], slides: slidesFor(kind, week, content, config),
        media: { adaptive: true, audio: `media/${config.slug}/${id}/narration.mp3`, video: `media/${config.slug}/${id}/lesson.mp4`, captions: `media/${config.slug}/${id}/captions.vtt`, transcript: content.map((block) => `${block.heading}. ${block.body}${block.translation ? ` ${block.translation}` : ""}`).join("\n\n") },
        questions: questionBank(id, week, dayIndex, config), masteryThreshold: 0.85, estimatedMinutes: kind.key === "mission" ? 55 : kind.key === "input" ? 45 : 35
      };
      sections.push(section); return id;
    });
    return { week: week.week, phase: week.phase, level: week.level, title: week.title, canDo: week.functions, sectionIds: moduleSections, readingAssignments: readings };
  });
  const course = { schemaVersion: 2, slug: config.slug, id: config.id, title: config.title, subtitle: config.subtitle, description: config.description, targetLocale: config.targetLocale, instructionLocale: config.instructionLocale, flags: config.flags, target: shared.target, disclaimer: shared.disclaimer[config.slug], modules, sections, readingAssignments };
  const directory = resolve(OUT, config.slug); await mkdir(directory, { recursive: true });
  await writeFile(resolve(directory, "course.json"), `${JSON.stringify(course, null, 2)}\n`);
  console.log(`Generated ${config.slug}: ${modules.length} weeks, ${sections.length} sections, ${sections.reduce((n, section) => n + section.questions.length, 0)} questions, and ${readingAssignments.length} reading assignments.`);
}

const requested = process.argv.includes("--course") ? process.argv[process.argv.indexOf("--course") + 1] : "all";
if (!["es", "en", "all"].includes(requested)) throw new Error(`Unknown course: ${requested}`);
for (const config of Object.values(configs).filter((item) => requested === "all" || item.slug === requested)) await buildCourse(config);
