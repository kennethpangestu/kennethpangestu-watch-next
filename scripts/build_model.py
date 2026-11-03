"""Train the EASE recommender on MovieLens and export a compact model for the web app.

EASE (Steck, 2019) learns an item-item weight matrix B in closed form:
    P = (X^T X + lambda * I)^-1
    B = I - P / diag(P),  with diag(B) = 0
where X is the user x movie matrix of "liked" ratings (4 stars or more).
A user's score for movie j is the sum of B[i, j] over the movies i they liked.

The full B matrix is too large to ship to a browser, so for each movie we keep
only its strongest positive links. The app sums those links on the fly.

Usage:
    python scripts/build_model.py path/to/ml-latest-small src/data/model.json
"""

import json
import re
import sys
from pathlib import Path

import numpy as np
import pandas as pd

LAMBDA = 200.0          # regularization, as tuned in the original analysis
LIKED_THRESHOLD = 4.0   # a rating of 4+ counts as "liked"
MIN_RATINGS = 15        # movies need this many ratings to be in the app
TOP_K = 25              # strongest links kept per movie

ARTICLES = ("The", "A", "An", "La", "Le", "Les", "L'", "Il", "Das", "Die", "Der", "El", "Los", "Las")


def tidy_title(raw: str) -> tuple[str, str, int | None]:
    """'Matrix, The (1999)' -> ('The Matrix', '', 1999).

    Alternate titles in parentheses are split off so the app can show the short
    title and still match searches on the alternate one:
    'Spirited Away (Sen to Chihiro no kamikakushi) (2001)'
        -> ('Spirited Away', 'Sen to Chihiro no kamikakushi', 2001)
    """
    raw = raw.strip()
    year = None
    m = re.search(r"\((\d{4})(?:[–-]\d{0,4})?\)\s*$", raw)
    if m:
        year = int(m.group(1))
        raw = raw[: m.start()].strip()
    # Move a trailing article to the front, e.g. "Godfather, The" or
    # "Seven (a.k.a. Se7en)" stays as is.
    main, alt = raw, ""
    pm = re.search(r"\s\((.*)\)$", raw)
    if pm:
        main, alt = raw[: pm.start()], pm.group(1)
        alt = re.sub(r"^a\.k\.a\.\s*", "", alt)
    for art in ARTICLES:
        suffix = f", {art}"
        if main.endswith(suffix):
            joiner = "" if art.endswith("'") else " "
            main = f"{art}{joiner}{main[: -len(suffix)]}"
            break
    return main, alt, year


def main(data_dir: str, out_path: str) -> None:
    data = Path(data_dir)
    ratings = pd.read_csv(data / "ratings.csv")
    movies = pd.read_csv(data / "movies.csv")
    links = pd.read_csv(data / "links.csv")

    stats = ratings.groupby("movieId")["rating"].agg(["count", "mean"])
    keep = stats.index[stats["count"] >= MIN_RATINGS]
    stats = stats.loc[keep]

    liked = ratings[(ratings["rating"] >= LIKED_THRESHOLD) & ratings["movieId"].isin(keep)]
    item_ids = np.array(sorted(keep))
    item_pos = {m: i for i, m in enumerate(item_ids)}
    user_ids = liked["userId"].unique()
    user_pos = {u: i for i, u in enumerate(user_ids)}

    X = np.zeros((len(user_ids), len(item_ids)), dtype=np.float64)
    X[liked["userId"].map(user_pos).to_numpy(), liked["movieId"].map(item_pos).to_numpy()] = 1.0

    G = X.T @ X
    G[np.diag_indices_from(G)] += LAMBDA
    P = np.linalg.inv(G)
    B = -P / np.diag(P)
    np.fill_diagonal(B, 0.0)

    # Keep the strongest positive outgoing links for each movie.
    neighbors = []
    for i in range(len(item_ids)):
        row = B[i]
        top = np.argpartition(-row, TOP_K)[:TOP_K]
        top = top[np.argsort(-row[top])]
        top = [j for j in top if row[j] > 0]
        neighbors.append([[int(j), round(float(row[j]) * 1000)] for j in top if round(float(row[j]) * 1000) > 0])

    meta = movies.set_index("movieId").join(links.set_index("movieId")).loc[item_ids]
    genre_names = sorted({g for gs in meta["genres"] for g in gs.split("|") if g != "(no genres listed)"})
    genre_idx = {g: i for i, g in enumerate(genre_names)}

    out_movies = []
    for mid, row in meta.iterrows():
        title, alt, year = tidy_title(row["title"])
        out_movies.append({
            "t": title,
            **({"alt": alt} if alt else {}),
            "y": year,
            "g": [genre_idx[g] for g in row["genres"].split("|") if g in genre_idx],
            "n": int(stats.loc[mid, "count"]),
            "a": round(float(stats.loc[mid, "mean"]), 2),
            "tmdb": None if pd.isna(row["tmdbId"]) else int(row["tmdbId"]),
        })

    model = {
        "meta": {
            "source": "MovieLens ml-latest-small (GroupLens Research)",
            "ratings": int(len(ratings)),
            "users": int(ratings["userId"].nunique()),
            "movies": len(item_ids),
            "lambda": LAMBDA,
            "topK": TOP_K,
            "likedThreshold": LIKED_THRESHOLD,
        },
        "genres": genre_names,
        "movies": out_movies,
        "neighbors": neighbors,
    }
    Path(out_path).parent.mkdir(parents=True, exist_ok=True)
    Path(out_path).write_text(json.dumps(model, separators=(",", ":"), ensure_ascii=False))
    print(f"{len(item_ids)} movies, {sum(len(n) for n in neighbors)} links -> {out_path}")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
