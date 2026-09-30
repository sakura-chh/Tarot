import secrets
import unicodedata
from collections.abc import Callable


def normalize(text: str) -> str:
    return " ".join(unicodedata.normalize("NFKC", text).lower().split())


def search_cards(cards: list[dict], q: str = "", arcana=None, suit=None) -> list[dict]:
    query = normalize(q)
    words = query.split()
    result = []
    for card in cards:
        if arcana and card["arcana"] != arcana or suit and card["suit"] != suit:
            continue
        names = [normalize(card["name_zh"]), normalize(card["name_en"])]
        aliases = [normalize(a) for a in card["aliases"]]
        keys = [normalize(a) for a in card["keywords_upright"] + card["keywords_reversed"]]
        meanings = [normalize(card["meaning_upright"]), normalize(card["meaning_reversed"])]
        fields = names + aliases + keys + meanings
        if not all(any(word in field for field in fields) for word in words):
            continue
        score = (
            0
            if query in names
            else 1
            if query in aliases
            else 2
            if any(n.startswith(query) for n in names)
            else 3
            if any(query in k for k in keys)
            else 4
        )
        result.append((score, card["sort_order"], card["id"], card))
    return [item[3] for item in sorted(result)]


def shuffled_slots(
    cards: list[dict],
    enabled: bool,
    probability: int,
    random_int: Callable[[int], int] = secrets.randbelow,
) -> list[dict]:
    ids = [card["id"] for card in cards]
    for i in range(len(ids) - 1, 0, -1):
        j = random_int(i + 1)
        ids[i], ids[j] = ids[j], ids[i]
    return [
        {
            "slot_id": f"slot-{i:02}",
            "card_id": card_id,
            "is_reversed": enabled and random_int(100) < probability,
        }
        for i, card_id in enumerate(ids)
    ]
