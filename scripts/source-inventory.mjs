export const sources = [
  { id: "spanish-dummies", match: "Spanish for Dummies", format: "pdf", roles: ["foundation", "conversation", "travel", "culture"] },
  { id: "fifteen-minute", match: "15-Minute Spanish", format: "pdf", roles: ["foundation", "conversation", "review"] },
  { id: "lingo-stories-20", match: "Spanish Short Stories for Beginners 20 Captivating", format: "epub", roles: ["reader", "vocabulary"] },
  { id: "aventuras", match: "Aventuras primer curso", format: "pdf", roles: ["foundation", "grammar", "culture", "reader"] },
  { id: "learning-spanish-i", match: "Learning Spanish How to Understand and Speak a New Language (Bill", format: "pdf", roles: ["foundation", "grammar", "pronunciation"] },
  { id: "visual-dictionary", match: "Spanish Visual Dictionary", format: "pdf", roles: ["vocabulary", "visual"] },
  { id: "complete-step", match: "Complete Spanish Step-By-Step", format: "pdf", roles: ["grammar", "foundation", "advanced"] },
  { id: "olly-stories-8", match: "Spanish Short Stories for Beginners. 8 More", format: "epub", roles: ["reader", "vocabulary"] },
  { id: "collins-grammar", match: "Collins Easy Learning Spanish Grammar (", format: "epub", roles: ["grammar", "reference"] },
  { id: "illustrated-beginner", match: "Learn Spanish for beginners_ Illustrated", format: "epub", roles: ["foundation", "grammar", "visual"] },
  { id: "grammar-beginners", match: "Learn Spanish Grammar For Beginners", format: "epub", roles: ["grammar", "practice"] },
  { id: "spanish-revised", match: "SPANISH Revised, Expanded", format: "epub", roles: ["foundation", "conversation", "reader"] },
  { id: "mobile-stories-50", match: "Spanish Short Stories For Beginners (Easy Spanish) 50", format: "epub", roles: ["reader", "visual"] },
  { id: "imagina", match: "Imagina Espa", format: "pdf", roles: ["advanced", "culture", "reader", "video"] },
  { id: "learning-spanish-ii", match: "Learning Spanish II", format: "pdf", roles: ["advanced", "grammar", "pronunciation"] },
  { id: "panorama", match: "Panorama Introdu", format: "pdf", roles: ["foundation", "grammar", "culture", "reader"] },
  { id: "everything-spanish", match: "The everything learning Spanish book", format: "epub", roles: ["foundation", "grammar", "conversation"] },
  { id: "language-hacking", match: "LANGUAGE HACKING SPANISH", format: "pdf", roles: ["method", "conversation", "pronunciation"] },
  { id: "learning-to-read", match: "Learning to Read in a New Language", format: "pdf", roles: ["method", "reader", "literacy"] },
  { id: "polyglot-pdf", match: "Polyglot How I Learn Languages", format: "pdf", roles: ["method"] },
  { id: "thirty-one-steps", match: "31 Steps to Learn a New Language", format: "epub", roles: ["method"] },
  { id: "intermediate-dummies", match: "Intermediate Spanish For Dummies", format: "pdf", roles: ["grammar", "advanced", "writing"] },
  { id: "collins-conversation", match: "Easy Learning Spanish Conversation", format: "epub", roles: ["conversation", "pronunciation", "travel"] },
  { id: "polyglot-epub", match: "Polyglot How I Learn Languages", format: "epub", roles: ["method"] },
  { id: "parallel-stories-8", match: "Learn Spanish - Parallel Text", format: "epub", roles: ["reader", "conversation"] },
  { id: "grammar-colour", match: "Collins Easy Learning Spanish Grammar in Colour", format: "pdf", roles: ["grammar", "visual", "reference"] },
  { id: "learn-300", match: "Learn Spanish - 300", format: "epub", roles: ["method", "pronunciation"] },
  { id: "collins-idioms", match: "Collins Easy Learning Spanish Idioms", format: "epub", roles: ["idiom", "advanced", "culture"] },
  { id: "everything-kids", match: "The everything kids learning Spanish", format: "epub", roles: ["foundation", "practice", "visual"] },
  { id: "learning-spanish-workbook", match: "Learning Spanish How to Understand and Speak a New Language - Course Workbook", format: "pdf", roles: ["practice", "grammar"] },
  { id: "learning-language-dummies", match: "Learning a New Language For Dummies", format: "pdf", roles: ["method", "planning"] }
];

export const readerAssignments = [
  ...Array.from({ length: 20 }, (_, i) => ({ sourceId: "lingo-stories-20", node: `chapter-${i + 1}`, label: `Lingo Mastery story ${i + 1}` })),
  ...["El Castillo", "El Cocinero", "Robot", "Historias de Guerra", "Rock", "El Comerciante", "Exploradores", "La Costa"].map((label, i) => ({ sourceId: "olly-stories-8", node: `story-${i + 1}`, label })),
  ...Array.from({ length: 50 }, (_, i) => ({ sourceId: "mobile-stories-50", node: `story-${i + 1}`, label: `Easy Spanish illustrated story ${i + 1}` })),
  ...["La Tomatina", "Las curiosas tiendas", "Comer en España", "Ir al cine", "Estados Unidos sobre ruedas", "Cita online", "Un cómico en el supermercado", "¿Por qué yo?"].map((label, i) => ({ sourceId: "parallel-stories-8", node: `story-${i + 1}`, label })),
  ...Array.from({ length: 2 }, (_, i) => ({ sourceId: "spanish-revised", node: `short-story-${i + 1}`, label: `Step-by-step short story ${i + 1}` }))
];

export function sourceIdsForRoles(...roles) {
  return sources.filter((source) => roles.some((role) => source.roles.includes(role))).map((source) => source.id);
}
