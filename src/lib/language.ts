const spanishSignals = new Set([
  "a", "al", "con", "como", "de", "del", "el", "ella", "en", "es", "esta", "este", "hay", "la", "las", "le", "lo", "los", "me", "mi", "no", "nos", "para", "pero", "por", "que", "se", "sin", "son", "su", "te", "tu", "un", "una", "usted", "y", "yo"
]);

const englishSignals = new Set([
  "a", "and", "are", "basic", "by", "can", "choose", "complete", "for", "from", "in", "is", "it", "of", "or", "section", "the", "this", "to", "use", "week", "with", "you", "your"
]);

export function narrationLocale(value: string): "es-US" | "en-US" {
  const words = value.toLocaleLowerCase().match(/[\p{L}]+/gu) ?? [];
  let spanish = /[áéíóúñü¿¡]/iu.test(value) ? 2 : 0;
  let english = 0;
  for (const word of words) {
    if (spanishSignals.has(word)) spanish += 1;
    if (englishSignals.has(word)) english += 1;
  }
  return spanish > english ? "es-US" : "en-US";
}
