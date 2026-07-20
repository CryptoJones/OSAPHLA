#!/usr/bin/env python3
"""Render a batch of lesson utterances with local Kokoro voice profiles."""

import argparse
import json
import os
import re
from pathlib import Path

import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

PROFILES = {
    "dora": {"speed": 0.88, "voices": {"ef_dora": 1.0}},
    "y1": {"speed": 0.90, "voices": {"ef_dora": 0.75, "af_sky": 0.25}},
    "y3": {"speed": 0.90, "voices": {"ef_dora": 0.75, "af_bella": 0.25}},
    "santa": {"speed": 0.88, "voices": {"em_santa": 1.0}},
    "e": {"speed": 0.88, "voices": {"ef_dora": 0.60, "em_santa": 0.40}},
    "heart": {"speed": 0.90, "voices": {"af_heart": 1.0}},
    "bella": {"speed": 0.90, "voices": {"af_bella": 1.0}},
    "sky": {"speed": 0.90, "voices": {"af_sky": 1.0}},
    "michael": {"speed": 0.90, "voices": {"am_michael": 1.0}},
    "liam": {"speed": 0.90, "voices": {"am_liam": 1.0}},
}

SPANISH = {"al", "con", "como", "de", "del", "donde", "el", "ella", "en", "es", "esta", "este", "hay", "la", "las", "le", "lo", "los", "me", "mi", "no", "nos", "para", "pero", "por", "que", "se", "sin", "son", "su", "te", "tu", "un", "una", "usted", "ustedes", "y", "yo"}
ENGLISH = {"and", "are", "basic", "by", "can", "choose", "complete", "for", "from", "in", "is", "it", "language", "model", "of", "or", "section", "the", "this", "to", "use", "week", "with", "you", "your"}
SPANISH_TECHNICAL_TERMS = {
    "-aba", "-ar", "-er", "-ía", "-ir", "a/e/i/o/u", "acabar de", "antes de", "antes de que",
    "a menos que", "cuando", "cuyo", "dar", "deber", "después de", "decir", "distinción", "doblar",
    "el que", "es la", "estar", "gustar", "haber", "hacer", "hay", "ir", "le", "leísmo", "les",
    "lo que", "nosotros", "para", "para que", "pero", "poder", "por", "que", "quien", "querer",
    "quisiera", "saber", "se", "seguir", "ser", "si", "seseo", "son las", "tener", "tú", "usted",
    "ustedes", "venir", "vos", "voseo", "vosotros", "yeísmo",
}
ENGLISH_TECHNICAL_TERMS = {
    "a, an", "an", "the", "be", "been", "being", "do", "does", "did", "can", "can't", "could", "couldn't",
    "have", "had", "have to", "has to", "had to", "want to", "would", "would like", "should", "should have", "ought to",
    "may", "might", "must", "will", "going to", "this", "that", "these", "those", "there is", "there are",
    "some", "any", "much", "many", "who", "which", "whose", "where", "when", "why", "what", "how", "his", "is",
    "if", "unless", "in case", "as soon as", "so that", "in order to", "before", "after", "although",
    "even though", "because", "by", "for", "since", "one", "ones", "to", "-s", "-ed", "-ing", "-teen", "-ty", "wh-",
    "do-support", "schwa", "stress", "linking", "phrasal verb", "phrasal verbs", "idiom", "idioms",
    "reported speech", "present simple", "present continuous", "past simple", "past continuous", "past perfect",
    "present perfect", "future perfect", "zero conditional", "first conditional", "second conditional", "used to",
    "like", "love", "prefer", "let's", "i'd", "work", "walk", "food", "good", "th", "clothes",
    "first", "then", "feel", "hurt", "give", "send", "show", "get something done", "hedging", "seem", "likely", "unlikely",
}


def find_model_dir() -> Path:
    candidates = [
        os.environ.get("KOKORO_MODEL_DIR"),
        str(Path.home() / "source/repos/espanol/.local/models"),
        str(Path.home() / "source/repos/systems-design/pipeline/models"),
        str(Path.home() / "source/repos/intro-statistics/pipeline/models"),
    ]
    for candidate in candidates:
        if not candidate:
            continue
        directory = Path(candidate).expanduser()
        if directory.joinpath("kokoro-v1.0.onnx").exists() and directory.joinpath("voices-v1.0.bin").exists():
            return directory
    raise SystemExit("Kokoro models not found; set KOKORO_MODEL_DIR or install them in .local/models")


def narration_locale(text: str) -> str:
    words = re.findall(r"[^\W\d_]+", text.casefold(), flags=re.UNICODE)
    spanish = 2 if re.search(r"[áéíóúñü¿¡]", text.casefold()) else 0
    english = 0
    for word in words:
        spanish += word in SPANISH
        english += word in ENGLISH
    return "es-419" if spanish > english else "en-us"


def split_sentences(text: str):
    return [part.strip() for part in re.split(r"(?<=[.!?])\s+", " ".join(text.split())) if part.strip()]


def spanish_pattern(terms):
    vocabulary = {term.strip().casefold() for term in terms if term.strip()} | SPANISH_TECHNICAL_TERMS
    alternatives = sorted((re.escape(term).replace(r"\ ", r"\s+") for term in vocabulary), key=len, reverse=True)
    return re.compile(rf"(?<![^\W\d_])(?:{'|'.join(alternatives)})(?![^\W\d_])", flags=re.IGNORECASE | re.UNICODE)


def term_pattern(terms):
    vocabulary = {term.strip().casefold() for term in terms if term.strip()} | ENGLISH_TECHNICAL_TERMS
    alternatives = sorted((re.escape(term).replace(r"\ ", r"\s+") for term in vocabulary), key=len, reverse=True)
    return re.compile(rf"(?<![^\W\d_])(?:{'|'.join(alternatives)})(?![^\W\d_])", flags=re.IGNORECASE | re.UNICODE) if alternatives else None


def spanish_spans(text: str, pattern):
    spans = [match.span() for match in pattern.finditer(text)]
    spans.extend(match.span() for match in re.finditer(r"[^\W\d_]*[áéíóúñü][^\W\d_]*", text, flags=re.IGNORECASE | re.UNICODE))
    merged = []
    for start, end in sorted(spans):
        if merged and start <= merged[-1][1]:
            merged[-1] = (merged[-1][0], max(end, merged[-1][1]))
        else:
            merged.append((start, end))
    return merged


def is_spanish_sentence(text: str, spans) -> bool:
    words = list(re.finditer(r"[^\W\d_]+", text.casefold(), flags=re.UNICODE))
    if not words:
        return False
    if text.lstrip().startswith(("¿", "¡")):
        return True
    labeled = 0
    for word in words:
        inside_span = any(start <= word.start() and word.end() <= end for start, end in spans)
        if inside_span or word.group() in SPANISH or re.search(r"[áéíóúñü]", word.group()):
            labeled += 1
    if labeled / len(words) >= 0.60:
        return True
    english_hits = sum(word.group() in ENGLISH for word in words)
    return english_hits == 0 and narration_locale(text) == "es-419"


def language_segments(text: str, pattern):
    spans = spanish_spans(text, pattern)
    if is_spanish_sentence(text, spans):
        return [{"text": text, "lang": "es-419"}]
    if not spans:
        return [{"text": text, "lang": "en-us"}]
    segments = []
    cursor = 0
    for start, end in spans:
        if start > cursor:
            segments.append({"text": text[cursor:start], "lang": "en-us"})
        segments.append({"text": text[start:end], "lang": "es-419"})
        cursor = end
    if cursor < len(text):
        segments.append({"text": text[cursor:], "lang": "en-us"})
    return [segment for segment in segments if segment["text"]]


def english_language_segments(text: str, pattern):
    spans = [match.span() for match in pattern.finditer(text)] if pattern else []
    words = re.findall(r"[^\W\d_]+", text.casefold(), flags=re.UNICODE)
    english_hits = sum(word in ENGLISH for word in words)
    spanish_hits = sum(word in SPANISH for word in words) + (2 if re.search(r"[áéíóúñü¿¡]", text.casefold()) else 0)
    longest_span = max((end - start for start, end in spans), default=0)
    if longest_span >= max(1, len(text.strip()) * 0.55) or (english_hits > spanish_hits and spanish_hits == 0):
        return [{"text": text, "lang": "en-us"}]
    if not spans:
        return [{"text": text, "lang": "es-419"}]
    segments = []
    cursor = 0
    for start, end in spans:
        if start > cursor:
            segments.append({"text": text[cursor:start], "lang": "es-419"})
        segments.append({"text": text[start:end], "lang": "en-us"})
        cursor = end
    if cursor < len(text):
        segments.append({"text": text[cursor:], "lang": "es-419"})
    return [segment for segment in segments if segment["text"]]


def sentence_phonemes(kokoro: Kokoro, text: str, pattern, course: str, forced_language=None):
    if forced_language:
        segments = [{"text": text, "lang": forced_language}]
    else:
        segments = language_segments(text, pattern) if course == "es" else english_language_segments(text, pattern)
    phonemes = [kokoro.tokenizer.phonemize(segment["text"], segment["lang"]).strip() for segment in segments]
    return " ".join(part for part in phonemes if part), segments


def profile_style(kokoro: Kokoro, name: str):
    styles = [weight * kokoro.get_voice_style(voice) for voice, weight in PROFILES[name]["voices"].items()]
    return np.sum(styles, axis=0)


def synthesize(kokoro: Kokoro, style, speed: float, text: str, pattern, course: str, forced_language=None):
    chunks = [np.zeros(int(24_000 * 0.30), dtype="float32")]
    sample_rate = 24_000
    sentences = split_sentences(text)
    audit = []
    for index, sentence in enumerate(sentences):
        phonemes, segments = sentence_phonemes(kokoro, sentence, pattern, course, forced_language)
        samples, sample_rate = kokoro.create(phonemes, voice=style, speed=speed, is_phonemes=True)
        chunks.append(samples.astype("float32", copy=False))
        audit.append({"text": sentence, "segments": segments, "phonemes": phonemes})
        if index < len(sentences) - 1:
            chunks.append(np.zeros(int(sample_rate * 0.28), dtype="float32"))
    chunks.append(np.zeros(int(sample_rate * 0.63), dtype="float32"))
    return np.concatenate(chunks), sample_rate, audit


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--course", choices=["es", "en"], required=True)
    parser.add_argument("--profile", choices=sorted(PROFILES), required=True)
    parser.add_argument("--input-json", type=Path, required=True)
    parser.add_argument("--output-dir", type=Path, required=True)
    parser.add_argument("--audit-json", type=Path)
    args = parser.parse_args()

    directory = find_model_dir()
    kokoro = Kokoro(str(directory / "kokoro-v1.0.onnx"), str(directory / "voices-v1.0.bin"))
    style = profile_style(kokoro, args.profile)
    profile = PROFILES[args.profile]
    payload = json.loads(args.input_json.read_text(encoding="utf-8"))
    utterances = payload if isinstance(payload, list) else payload["utterances"]
    target_terms = [] if isinstance(payload, list) else payload.get("targetTerms", payload.get("spanishTerms", []))
    pattern = spanish_pattern(target_terms) if args.course == "es" else term_pattern(target_terms)
    args.output_dir.mkdir(parents=True, exist_ok=True)
    audit = {"profile": args.profile, "utterances": []}
    for utterance in utterances:
        audio, sample_rate, sentences = synthesize(kokoro, style, profile["speed"], utterance["text"], pattern, args.course, utterance.get("language"))
        sf.write(args.output_dir / utterance["file"], audio, sample_rate)
        audit["utterances"].append({"file": utterance["file"], "text": utterance["text"], "sentences": sentences})
    if args.audit_json:
        args.audit_json.write_text(json.dumps(audit, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Kokoro profile={args.profile}: {len(utterances)} utterances at {profile['speed']}x")


if __name__ == "__main__":
    main()
