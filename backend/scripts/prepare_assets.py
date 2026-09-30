"""Generate web assets and import supplied music; never overwrite the supplied originals."""

import argparse
import hashlib
import importlib.util
import json
import math
import random
import re
import shutil
import struct
import subprocess
import wave
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "media" / "v1"
VERSION = "2026.10.01.1"
spec = importlib.util.spec_from_file_location("meanings", ROOT / "backend/content/meanings.py")
meanings = importlib.util.module_from_spec(spec)
spec.loader.exec_module(meanings)

MAJOR_IDS = (
    "fool magician high_priestess empress emperor hierophant lovers chariot justice hermit "
    "wheel_of_fortune strength hanged_man death temperance devil tower star moon sun "
    "judgement world"
).split()
RANKS = "Ace Two Three Four Five Six Seven Eight Nine Ten Page Knight Queen King".split()
RANK_IDS = ["ace", *[f"{n:02}" for n in range(2, 11)], "page", "knight", "queen", "king"]
RANK_ZH = "王牌 二 三 四 五 六 七 八 九 十 侍从 骑士 皇后 国王".split()
SUITS = {
    "Swords": ("swords", "宝剑", 22),
    "Wands": ("wands", "权杖", 36),
    "Pentacles": ("pentacles", "星币", 50),
    "Cups": ("cups", "圣杯", 64),
}
SPREADS = [
    {
        "id": "daily",
        "name": "每日一牌",
        "description": "给今天一个温柔的提醒",
        "min_count": 1,
        "max_count": 1,
        "positions": ["今日提示"],
    },
    {
        "id": "past_present_future",
        "name": "时间之流",
        "description": "过去 · 现在 · 未来",
        "min_count": 3,
        "max_count": 3,
        "positions": ["过去", "现在", "未来"],
    },
    {
        "id": "situation_obstacle_advice",
        "name": "内在指引",
        "description": "现状 · 阻碍 · 建议",
        "min_count": 3,
        "max_count": 3,
        "positions": ["现状", "阻碍", "建议"],
    },
    {
        "id": "free",
        "name": "自由探索",
        "description": "让直觉带你选择 1–10 张牌",
        "min_count": 1,
        "max_count": 10,
        "positions": [],
    },
]


def image_asset(image: Image.Image, name: str, size: int, quality: int) -> str:
    image = image.copy()
    image.thumbnail((size, size), Image.Resampling.LANCZOS)
    temporary = OUT / f"{name}.webp"
    image.save(temporary, "WEBP", quality=quality, method=6)
    digest = hashlib.sha256(temporary.read_bytes()).hexdigest()[:12]
    destination = OUT / f"{name}-{digest}.webp"
    temporary.rename(destination)
    return f"/media/v1/{destination.name}"


def write_audio(name: str, seconds: float) -> str:
    rate = 22050
    rng = random.Random(4040)
    values = bytearray()
    last_noise = 0.0
    for i in range(int(rate * seconds)):
        t = i / rate
        if name == "ambient":
            # Frequencies complete integer cycles over the loop, so its seam stays quiet.
            value = sum(
                math.sin(2 * math.pi * round(f * seconds) / seconds * t) / (j + 2)
                for j, f in enumerate([130.8, 196.0, 261.6, 392.0])
            )
            value *= 0.16 * (0.65 + 0.35 * math.cos(2 * math.pi * t / seconds))
        else:
            last_noise = last_noise * 0.75 + rng.uniform(-1, 1) * 0.25
            envelope = math.sin(math.pi * t / seconds) ** 2
            value = last_noise * envelope * (0.48 if name == "shuffle" else 0.65)
        values.extend(struct.pack("<h", int(max(-1, min(1, value)) * 32767)))
    path = OUT / f"{name}.wav"
    with wave.open(str(path), "wb") as stream:
        stream.setnchannels(1)
        stream.setsampwidth(2)
        stream.setframerate(rate)
        stream.writeframes(values)
    return f"/media/v1/{path.name}"


def supplied_music() -> str | None:
    source = ROOT / "assets/sounds.mp4"
    if not source.is_file():
        return None
    source_hash = hashlib.sha256(source.read_bytes()).hexdigest()[:12]
    name = f"music-{source_hash}"
    prepared = sorted(OUT.glob(f"{name}-*.m4a"))
    if prepared:
        return f"/media/v1/{prepared[0].name}"
    converter = shutil.which("afconvert")
    if converter:
        temporary = OUT / f"{name}.m4a"
        # Copy AAC packets without re-encoding, keeping the original MP4 intact.
        subprocess.run(
            [converter, "-f", "m4af", "-d", "0", str(source), str(temporary)], check=True
        )
        digest = hashlib.sha256(temporary.read_bytes()).hexdigest()[:12]
        destination = OUT / f"{name}-{digest}.m4a"
        temporary.rename(destination)
    else:
        # HTMLAudioElement can play the audio track directly on other platforms.
        destination = OUT / f"{name}.mp4"
        if not destination.exists():
            shutil.copyfile(source, destination)
    return f"/media/v1/{destination.name}"


def main(content_only: bool = False) -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    full_meanings = meanings.load_meanings()
    previous = (
        json.loads((ROOT / "backend/content/cards.json").read_text()) if content_only else None
    )
    previous_cards = {card["id"]: card for card in previous["cards"]} if previous else {}
    cards = []
    for path in sorted((ROOT / "assets").glob("*.jpg")):
        match = re.match(r"^(.*?)_(Major|Minor) Arcana Tarot Card\. (.*)\.jpg$", path.name, re.I)
        if not match:
            raise ValueError(f"Unmapped asset: {path.name}")
        prefix, category, name_en = match.groups()
        if category.lower() == "major":
            number = int(prefix)
            name_zh = meanings.MAJOR_NAMES[number]
            card_id = f"major_{MAJOR_IDS[number]}"
            suit = rank = None
            order = number
        else:
            name_rank, name_suit = name_en.split(" of ")
            suit, suit_zh, base = SUITS[name_suit]
            rank_index = RANKS.index(name_rank)
            rank = RANK_IDS[rank_index]
            card_id = f"{suit}_{rank}"
            name_zh = suit_zh + RANK_ZH[rank_index]
            order = base + rank_index
            number = None
        entry = full_meanings[card_id]
        if content_only:
            thumb = previous_cards[card_id]["images"]["thumbnail_url"]
            display = previous_cards[card_id]["images"]["display_url"]
        else:
            with Image.open(path) as image:
                thumb = image_asset(image, f"{card_id}-thumb", 340, 78)
                display = image_asset(image, f"{card_id}-display", 1200, 83)
        cards.append(
            {
                "id": card_id,
                "deck_id": "provided-deck-v1",
                "name_zh": name_zh,
                "name_en": name_en,
                "aliases": {
                    "major_high_priestess": ["女教皇"],
                    "major_fool": ["愚人"],
                    "major_hermit": ["隐士"],
                    "major_devil": ["魔鬼"],
                    "major_judgement": ["重生"],
                    "major_hanged_man": ["悬吊者"],
                }.get(card_id, [])
                + (
                    [f"The {name_en}"]
                    if category.lower() == "major" and not name_en.startswith("The ")
                    else []
                ),
                "arcana": category.lower(),
                "suit": suit,
                "rank": rank,
                "display_number": number,
                "sort_order": order,
                "keywords_upright": entry["keywords_upright"],
                "keywords_reversed": entry["keywords_reversed"],
                "meaning_upright": entry["summary_upright"],
                "meaning_reversed": entry["summary_reversed"],
                "meaning_details": {
                    key: entry[key] for key in ("overview", "symbolism", "upright", "reversed")
                },
                "meaning_source": entry["source"],
                "meaning_version": "2",
                "content_status": "draft",
                "images": {"thumbnail_url": thumb, "display_url": display},
            }
        )
    assert len(cards) == len({c["id"] for c in cards}) == 78
    cards.sort(key=lambda c: c["sort_order"])
    if previous:
        back, audio = previous["card_back_url"], previous["audio"]
    else:
        with Image.open(ROOT / "design/hourglass-card-back.png") as image:
            back = image_asset(image, "hourglass-card-back", 1200, 88)
        audio = {
            "music": write_audio("ambient", 20),
            "shuffle": write_audio("shuffle", 0.8),
            "flip": write_audio("flip", 0.22),
        }
    if music := supplied_music():
        audio["music"] = music
    for size in [] if content_only else [192, 512]:
        icon = Image.new("RGB", (size, size), "#efe4cc")
        pen = ImageDraw.Draw(icon)
        pen.rounded_rectangle(
            (size * 0.26, size * 0.13, size * 0.74, size * 0.87),
            radius=size * 0.05,
            outline="#735938",
            width=max(2, size // 64),
        )
        pen.polygon(
            [
                (size * 0.5, size * 0.25),
                (size * 0.56, size * 0.43),
                (size * 0.7, size * 0.5),
                (size * 0.56, size * 0.57),
                (size * 0.5, size * 0.75),
                (size * 0.44, size * 0.57),
                (size * 0.3, size * 0.5),
                (size * 0.44, size * 0.43),
            ],
            fill="#735938",
        )
        icon.save(OUT / f"icon-{size}.png")
    dataset = {
        "dataset_version": VERSION,
        "schema_version": "1",
        "rules_version": "1",
        "deck_id": "provided-deck-v1",
        "card_back_url": back,
        "audio": audio,
        "cards": cards,
        "spreads": SPREADS,
    }
    data_bytes = json.dumps(dataset, ensure_ascii=False, separators=(",", ":")).encode()
    digest = hashlib.sha256(data_bytes).hexdigest()
    dataset_path = OUT / f"dataset-{digest[:12]}.json"
    dataset_path.write_bytes(data_bytes)
    (ROOT / "backend/content/cards.json").write_text(
        json.dumps(dataset, ensure_ascii=False, indent=2) + "\n"
    )
    # Publish only this bundle's references; retained older files are not downloaded again.
    active_files = {url for card in cards for url in card["images"].values()}
    active_files.update(
        [
            back,
            *audio.values(),
            "/media/v1/icon-192.png",
            "/media/v1/icon-512.png",
            f"/media/v1/{dataset_path.name}",
        ]
    )
    for url in active_files:
        if not (ROOT / url.lstrip("/")).is_file():
            raise ValueError(f"Missing bundle resource: {url}")
    items = []
    for file in sorted(OUT.iterdir()):
        if file.is_file() and f"/media/v1/{file.name}" in active_files:
            content = file.read_bytes()
            items.append(
                {
                    "url": f"/media/v1/{file.name}",
                    "bytes": len(content),
                    "sha256": hashlib.sha256(content).hexdigest(),
                    "group": "audio" if f"/media/v1/{file.name}" in audio.values() else "core",
                    "required": f"/media/v1/{file.name}" not in audio.values(),
                }
            )
    manifest = {
        "bundle_version": f"v1-{digest[:12]}",
        "dataset_version": VERSION,
        "schema_version": "1",
        "dataset_url": f"/media/v1/{dataset_path.name}",
        "total_bytes": sum(i["bytes"] for i in items),
        "items": items,
    }
    (ROOT / "media/manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n"
    )
    total_mb = manifest["total_bytes"] / 1e6
    print(f"Prepared {len(cards)} cards, {len(items)} resources, {total_mb:.2f} MB")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--content-only",
        action="store_true",
        help="Reuse images/effects while updating meanings and supplied music",
    )
    main(content_only=parser.parse_args().content_only)
