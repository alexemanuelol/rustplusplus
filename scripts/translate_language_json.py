#!/usr/bin/env python3
import argparse
import json
import os
import re
import sys
import time
from pathlib import Path
from typing import Dict, List, Tuple

import requests

PLACEHOLDER_RE = re.compile(r"\{[^{}]+\}")
DEEPL_BYTE_LIMIT = 120 * 1024  # keep below the official 128 KiB limit

DEFAULT_LANGUAGES = [
    "cs",
    "de",
    "es",
    "fr",
    "it",
    "ko",
    "pl",
    "pt",
    "ru",
    "sv",
    "tr",
]


def load_json(path: Path) -> Dict[str, str]:
    if not path.exists():
        return {}
    with path.open("r", encoding="utf-8") as f:
        data = json.load(f)
    if not isinstance(data, dict):
        raise ValueError(f"{path} must contain a JSON object")
    return data


def sort_dict(data: Dict[str, str]) -> Dict[str, str]:
    return dict(sorted(data.items(), key=lambda item: item[0].lower()))


def save_json(path: Path, data: Dict[str, str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    sorted_data = sort_dict(data)
    with path.open("w", encoding="utf-8") as f:
        json.dump(sorted_data, f, ensure_ascii=False, indent=4)
        f.write("\n")


def mask_placeholders(text: str) -> Tuple[str, Dict[str, str]]:
    mapping: Dict[str, str] = {}

    def repl(match: re.Match) -> str:
        token = f"__PH_{len(mapping)}__"
        mapping[token] = match.group(0)
        return token

    return PLACEHOLDER_RE.sub(repl, text), mapping


def unmask_placeholders(text: str, mapping: Dict[str, str]) -> str:
    for token, original in mapping.items():
        text = text.replace(token, original)
    return text


def build_context(key: str) -> str:
    return (
        "This text is from a video game / Discord bot localization file. "
        f"The JSON key is '{key}'. Keep placeholders like __PH_0__ unchanged. "
        "Preserve punctuation, casing, and line breaks where sensible. "
        "Return only the translated text."
    )


def chunk_for_deepl(entries: List[Tuple[str, str]]) -> List[List[Tuple[str, str]]]:
    chunks: List[List[Tuple[str, str]]] = []
    current: List[Tuple[str, str]] = []
    current_size = 0
    for item in entries:
        item_size = len(item[1].encode("utf-8")) + 256
        if current and current_size + item_size > DEEPL_BYTE_LIMIT:
            chunks.append(current)
            current = []
            current_size = 0
        current.append(item)
        current_size += item_size
    if current:
        chunks.append(current)
    return chunks


class Translator:
    def translate_many(self, pairs: List[Tuple[str, str]], target_lang: str) -> Dict[str, str]:
        raise NotImplementedError


class DeepLTranslator(Translator):
    def __init__(self, api_key: str, source_lang: str = "EN", api_url: str | None = None, timeout: int = 60):
        self.api_key = api_key
        self.source_lang = source_lang
        self.api_url = api_url or os.getenv("DEEPL_API_URL") or "https://api-free.deepl.com/v2/translate"
        self.timeout = timeout
        self.session = requests.Session()

    def translate_many(self, pairs: List[Tuple[str, str]], target_lang: str) -> Dict[str, str]:
        result: Dict[str, str] = {}
        for chunk in chunk_for_deepl(pairs):
            payload: List[Tuple[str, str]] = [
                ("source_lang", self.source_lang),
                ("target_lang", target_lang),
                ("tag_handling", "xml"),
                ("ignore_tags", "ph"),
                ("preserve_formatting", "1"),
            ]

            contexts: List[str] = []
            masked_items: List[Tuple[str, str, Dict[str, str]]] = []
            for key, text in chunk:
                masked_text, mapping = mask_placeholders(text)
                masked_text = masked_text.replace("\n", "<ph br=\"1\"/>\n")
                masked_items.append((key, masked_text, mapping))
                payload.append(("text", masked_text))
                contexts.append(build_context(key))

            # DeepL supports one context for the whole request, so combine small hints.
            payload.append(("context", "\n".join(contexts)))

            response = self.session.post(
                self.api_url,
                headers={"Authorization": f"DeepL-Auth-Key {self.api_key}"},
                data=payload,
                timeout=self.timeout,
            )
            response.raise_for_status()
            data = response.json()
            translations = data.get("translations", [])
            if len(translations) != len(masked_items):
                raise RuntimeError("DeepL returned an unexpected number of translations")

            for (key, _, mapping), item in zip(masked_items, translations):
                translated = item["text"].replace('<ph br="1"/>\n', "\n").replace('<ph br="1"/>', "")
                result[key] = unmask_placeholders(translated, mapping)
            time.sleep(0.15)
        return result


class LibreTranslateTranslator(Translator):
    def __init__(self, base_url: str, api_key: str | None = None, source_lang: str = "en", timeout: int = 60):
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key
        self.source_lang = source_lang
        self.timeout = timeout
        self.session = requests.Session()

    def translate_many(self, pairs: List[Tuple[str, str]], target_lang: str) -> Dict[str, str]:
        result: Dict[str, str] = {}
        for key, text in pairs:
            masked_text, mapping = mask_placeholders(text)
            payload = {
                "q": masked_text,
                "source": self.source_lang,
                "target": target_lang.lower(),
                "format": "text",
            }
            if self.api_key:
                payload["api_key"] = self.api_key

            response = self.session.post(
                f"{self.base_url}/translate",
                json=payload,
                timeout=self.timeout,
            )
            response.raise_for_status()
            data = response.json()
            translated = data["translatedText"]
            result[key] = unmask_placeholders(translated, mapping)
            time.sleep(0.15)
        return result


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Incrementally translate localization JSON files.")
    parser.add_argument("--source", default="en.json", help="Path to source JSON file (default: en.json)")
    parser.add_argument("--output-dir", default="translations", help="Directory for target JSON files")
    parser.add_argument(
        "--languages",
        nargs="+",
        default=DEFAULT_LANGUAGES,
        help="Target languages, e.g. de fr es it pt-BR pl tr ru uk ja ko",
    )
    parser.add_argument("--provider", choices=["deepl", "libretranslate"], default="deepl")
    parser.add_argument("--deepl-key", default=os.getenv("DEEPL_API_KEY"))
    parser.add_argument("--deepl-source-lang", default="EN")
    parser.add_argument("--deepl-api-url", default=os.getenv("DEEPL_API_URL"))
    parser.add_argument("--libre-url", default=os.getenv("LIBRETRANSLATE_URL"))
    parser.add_argument("--libre-key", default=os.getenv("LIBRETRANSLATE_API_KEY"))
    parser.add_argument("--libre-source-lang", default="en")
    parser.add_argument("--force", action="store_true", help="Translate all keys again instead of only missing keys")
    parser.add_argument("--dry-run", action="store_true", help="Only show what would be translated")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    source_path = Path(args.source)
    output_dir = Path(args.output_dir)

    source = load_json(source_path)
    if not source:
        print(f"Source file is empty or missing: {source_path}", file=sys.stderr)
        return 1

    if args.provider == "deepl":
        if not args.deepl_key:
            print("Missing DeepL API key. Set --deepl-key or DEEPL_API_KEY.", file=sys.stderr)
            return 1
        translator: Translator = DeepLTranslator(
            api_key=args.deepl_key,
            source_lang=args.deepl_source_lang,
            api_url=args.deepl_api_url,
        )
    else:
        if not args.libre_url:
            print("Missing LibreTranslate URL. Set --libre-url or LIBRETRANSLATE_URL.", file=sys.stderr)
            return 1
        translator = LibreTranslateTranslator(
            base_url=args.libre_url,
            api_key=args.libre_key,
            source_lang=args.libre_source_lang,
        )

    total_new = 0
    for lang in args.languages:
        target_path = output_dir / f"{lang}.json"
        existing = load_json(target_path)

        missing_keys = [k for k in source.keys() if args.force or k not in existing or not str(existing.get(k, "")).strip()]
        print(f"[{lang}] existing={len(existing)} missing={len(missing_keys)} -> {target_path}")

        total_new += len(missing_keys)
        if args.dry_run:
            continue

        translated: Dict[str, str] = {}
        if missing_keys:
            pairs = [(k, str(source[k])) for k in missing_keys]
            translated = translator.translate_many(pairs, lang)

        merged = dict(existing)
        for key in source.keys():
            if key in translated:
                merged[key] = translated[key]
            elif key in existing:
                merged[key] = existing[key]
            else:
                merged[key] = source[key]

        save_json(target_path, merged)
        print(f"[{lang}] wrote {len(translated)} translated keys and sorted all keys")

    if args.dry_run:
        print(f"Dry run complete. Keys to translate: {total_new}")
    else:
        print(f"Done. Newly translated keys: {total_new}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
