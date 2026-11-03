// Search over the movie catalog, ignoring case and accents.

const fold = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export function buildSearchIndex(movies) {
  return movies.map((m, index) => ({
    index,
    title: fold(m.t),
    alt: m.alt ? fold(m.alt) : '',
    popularity: m.n,
  }));
}

/** Returns movie indices whose title matches the query, best matches first. */
export function searchMovies(searchIndex, query, { exclude = new Set(), limit = 8 } = {}) {
  const q = fold(query.trim());
  if (q.length < 2) return [];
  const hits = [];
  for (const entry of searchIndex) {
    if (exclude.has(entry.index)) continue;
    let rank;
    if (entry.title.startsWith(q) || entry.title.startsWith(`the ${q}`)) rank = 0;
    else if (entry.title.includes(q)) rank = 1;
    else if (entry.alt.includes(q)) rank = 2;
    else continue;
    hits.push({ ...entry, rank });
  }
  hits.sort((a, b) => a.rank - b.rank || b.popularity - a.popularity);
  return hits.slice(0, limit).map((h) => h.index);
}

/** Finds a movie by its exact display title (used for the sample profiles). */
export function findByTitle(movies, title) {
  return movies.findIndex((m) => m.t === title);
}
