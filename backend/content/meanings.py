"""Chinese card names and source-backed, independently written meaning content."""

import json
from pathlib import Path

MAJOR_NAMES = (
    "愚者 魔术师 女祭司 女皇 皇帝 教皇 恋人 战车 正义 隐者 命运之轮 力量 "
    "倒吊人 死神 节制 恶魔 高塔 星星 月亮 太阳 审判 世界"
).split()
CONTENT_FILES = (
    "meanings_major.json",
    "meanings_wands_cups.json",
    "meanings_swords_pentacles.json",
)
TOPICS = ("general", "love", "career", "advice")


def load_meanings() -> dict[str, dict]:
    """Reject incomplete source content before publishing an online/offline dataset."""
    result = {}
    for filename in CONTENT_FILES:
        entries = json.loads((Path(__file__).parent / filename).read_text())
        for card_id, entry in entries.items():
            if card_id in result:
                raise ValueError(f"Duplicate meaning: {card_id}")
            text_fields = ["summary_upright", "summary_reversed", "overview", "symbolism"]
            texts = [entry.get(field) for field in text_fields]
            for direction in ("upright", "reversed"):
                texts.extend(entry.get(direction, {}).get(topic) for topic in TOPICS)
                keywords = entry.get(f"keywords_{direction}")
                if (
                    not isinstance(keywords, list)
                    or not keywords
                    or not all(isinstance(word, str) and word.strip() for word in keywords)
                ):
                    raise ValueError(f"Invalid keywords: {card_id}/{direction}")
            if not all(isinstance(text, str) and text.strip() for text in texts):
                raise ValueError(f"Incomplete meaning: {card_id}")
            source = entry.get("source", {})
            if source.get("name") != "神婆网" or not source.get("url", "").startswith(
                "https://www.shenpowang.com/taluopai/"
            ):
                raise ValueError(f"Invalid meaning source: {card_id}")
            result[card_id] = entry
    if len(result) != 78:
        raise ValueError(f"Expected 78 meanings, found {len(result)}")
    return result
