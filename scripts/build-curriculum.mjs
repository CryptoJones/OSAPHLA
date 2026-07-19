import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { sectionKinds, weeks } from "./course-blueprint.mjs";

const ROOT = resolve(import.meta.dirname, "..");
const OUT = resolve(ROOT, "src/data");

const MODEL_TRANSLATIONS = [
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

const READING_TRANSLATIONS = [
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

function englishPrompt(item) {
  const hasDefiniteArticle = /^(el|la|los|las)\s/i.test(item.es);
  return hasDefiniteArticle && !/^the\s/i.test(item.en) ? `the ${item.en}` : item.en;
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

function questionBank(sectionId, week, sectionIndex) {
  const fixed = fixedQuestions(sectionId, week);
  if (fixed) return fixed;
  const vocab = rotate(week.vocabulary, sectionIndex);
  const multipleChoice = vocab.map((item, index) => {
    const distractors = [1, 2, 3].map((offset) => vocab[(index + offset) % vocab.length].es);
    return {
      id: `${sectionId}-mc-${index + 1}`,
      type: "multipleChoice",
      prompt: `Choose the best Spanish expression for “${englishPrompt(item)}”.`,
      choices: rotate([item.es, ...distractors], (index + sectionIndex) % 4),
      answer: item.es,
      rationale: `“${item.es}” means “${englishPrompt(item)}” in this section’s context.`,
      objective: week.functions[index % week.functions.length]
    };
  });

  const cloze = vocab.map((item, index) => ({
    id: `${sectionId}-cloze-${index + 1}`,
    type: "cloze",
    prompt: `Complete in Spanish: ${englishPrompt(item)} → ____`,
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
  const orderMeanings = [
    ...MODEL_TRANSLATIONS[week.week - 1],
    `For example, ${MODEL_TRANSLATIONS[week.week - 1][0].charAt(0).toLowerCase()}${MODEL_TRANSLATIONS[week.week - 1][0].slice(1)}`,
    `In this context, ${MODEL_TRANSLATIONS[week.week - 1][1].charAt(0).toLowerCase()}${MODEL_TRANSLATIONS[week.week - 1][1].slice(1)}`,
    `According to the situation, ${MODEL_TRANSLATIONS[week.week - 1][2].charAt(0).toLowerCase()}${MODEL_TRANSLATIONS[week.week - 1][2].slice(1)}`
  ].slice(0, 8);
  const ordering = orderModels.map((sentence, index) => {
    const answer = tokens(sentence);
    return {
      id: `${sectionId}-order-${index + 1}`,
      type: "ordering",
      prompt: `English meaning: “${orderMeanings[index]}” Put the Spanish words and punctuation in a natural order.`,
      tokens: rotate(answer, (index * 2 + sectionIndex + 1) % answer.length),
      answers: [answer],
      rationale: `A natural order is: ${sentence} It means: ${orderMeanings[index]}`,
      objective: week.functions[index % week.functions.length]
    };
  });
  return [...multipleChoice, ...cloze, ...ordering];
}

const readingAssignments = Array.from({ length: 88 }, (_, index) => ({
  id: `reading-${String(index + 1).padStart(2, "0")}`,
  label: `Reading activity ${index + 1}`
}));

function readingSlice(weekNumber) {
  const start = Math.floor(((weekNumber - 1) * readingAssignments.length) / weeks.length);
  const end = Math.floor((weekNumber * readingAssignments.length) / weeks.length);
  return readingAssignments.slice(start, Math.max(start + 1, end));
}

const readingFocuses = [
  {
    focus: "Main idea",
    instructions: "Read once for the overall situation. Read again and state the main idea in one sentence without translating every word.",
    prompts: ["Who or what is this passage mainly about?", "What is the central action or situation?", "Summarize the passage in one English sentence, then try one Spanish sentence."]
  },
  {
    focus: "Evidence and detail",
    instructions: "Read for evidence. Locate the exact words that establish people, actions, place, time, and change.",
    prompts: ["Identify three details stated directly in the passage.", "Which words establish when or where the situation occurs?", "What reasonable inference can you make, and which detail supports it?"]
  },
  {
    focus: "Language and retelling",
    instructions: "Notice reusable language, then retell the passage from memory. Preserve the meaning even if your wording changes.",
    prompts: ["Choose three useful words or phrases and explain them in context.", "Retell the events in order without looking back.", "Change one person, time, or place and retell the adapted version."]
  }
];

function contentFor(kind, week, readings) {
  const teaching = week.teaching ?? [];
  const shared = {
    briefing: [
      { heading: "Operational objective", body: `By the end of this section you can ${week.functions.join(", ")}. The focus is useful performance, not isolated terminology.` },
      { heading: "Language system", body: week.grammar },
      { heading: "Sound and delivery", body: week.pronunciation },
      { heading: "Core principle", body: `Notice meaning first, then form. Retrieve the new language aloud, compare it with the model, and repair one feature at a time.` },
      ...teaching
    ],
    patterns: [
      { heading: "Form and meaning", body: week.grammar },
      { heading: "Model set", body: week.models.join(" "), translation: MODEL_TRANSLATIONS[week.week - 1].join(" ") },
      { heading: "Contrastive practice", body: `Change the person, time, number, or level of formality in each model. Preserve the communicative purpose while the grammar changes.` },
      { heading: "Production check", body: `Say one original sentence for each function: ${week.functions.join("; ")}. Then write it and compare the spoken and written forms.` },
      ...teaching
    ],
    input: [
      { heading: "Read for the situation", body: week.reading, translation: READING_TRANSLATIONS[week.week - 1] },
      { heading: "Read again for evidence", body: `Identify who acts, what changes, when it happens, and which words establish the relationship between events.` },
      { heading: "Reading activities", body: readings.map((activity) => activity.label).join("; ") },
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
  const translations = MODEL_TRANSLATIONS[week.week - 1];
  return [
    { title: `Week ${week.week}: ${week.title}`, kicker: kind.label, body: week.functions },
    ...content.map((block) => ({ title: block.heading, body: [block.body, block.translation].filter(Boolean) })),
    { title: "Model language", body: week.models.map((model, index) => `${model} — ${translations[index]}`) },
    { title: "Check your readiness", body: ["Explain the core idea.", "Produce an original example.", "Complete the section assessment at 85% or higher."] }
  ];
}

const sections = [];
const modules = weeks.map((week) => {
  const inputSectionId = `w${String(week.week).padStart(2, "0")}-input`;
  const readings = readingSlice(week.week).map((assignment, index) => Object.assign(assignment, {
    title: `${week.title}: ${readingFocuses[index].focus}`,
    week: week.week,
    sectionId: inputSectionId,
    passage: week.reading,
    passageTranslation: READING_TRANSLATIONS[week.week - 1],
    ...readingFocuses[index]
  }));
  const modelTranslations = MODEL_TRANSLATIONS[week.week - 1];
  const moduleSections = sectionKinds.map((kind, dayIndex) => {
    const number = (week.week - 1) * 5 + dayIndex + 1;
    const id = `w${String(week.week).padStart(2, "0")}-${kind.key}`;
    const content = contentFor(kind.key, week, readings);
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
      vocabulary: week.vocabulary.map((item) => ({ ...item, en: englishPrompt(item) })),
      modelSentences: week.models,
      modelTranslations,
      reading: kind.key === "input" ? week.reading : undefined,
      readingTranslation: kind.key === "input" ? READING_TRANSLATIONS[week.week - 1] : undefined,
      culture: kind.key === "culture" ? week.culture : undefined,
      mission: kind.key === "mission" ? week.mission : undefined,
      readingAssignments: kind.key === "input" ? readings : [],
      slides: slidesFor(kind, week, content),
      media: {
        adaptive: true,
        audio: `/media/${id}/narration.mp3`,
        video: `/media/${id}/lesson.mp4`,
        captions: `/media/${id}/captions.vtt`,
        transcript: content.map((block) => `${block.heading}. ${block.body}${block.translation ? ` English meaning: ${block.translation}` : ""}`).join("\n\n")
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
    readingAssignments: readings
  };
});

const course = {
  schemaVersion: 1,
  id: "espanol-pan-hispanic-academy",
  title: "OSAPHLA",
  subtitle: "Open Source Accessible Pan-Hispanic Language Academy",
  description: "An open-source, accessible, 36-week, 180-section, offline-first Spanish course targeting an ILR 2 core with ILR 2+/2+/2 stretch preparation.",
  target: "ILR 2 core; ILR 2+/2+/2 stretch preparation",
  disclaimer: "Course scores and speaking feedback are formative and do not constitute an official ILR rating.",
  modules,
  sections,
  readingAssignments,
  generatedAt: new Date().toISOString()
};

await mkdir(OUT, { recursive: true });
await writeFile(resolve(OUT, "course.json"), `${JSON.stringify(course, null, 2)}\n`);
console.log(`Generated ${modules.length} weeks, ${sections.length} sections, ${sections.reduce((n, s) => n + s.questions.length, 0)} questions, and ${readingAssignments.length} reading assignments.`);
