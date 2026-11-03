// Scoring for the EASE recommender.
//
// The model holds, for every movie i, its strongest links to other movies:
// neighbors[i] = [[j, weight], ...] where weight = 1000 * B[i, j].
// EASE was trained on "liked" ratings (4+ stars), so a movie you loved pushes
// its neighbors up, and a movie you disliked pushes them down a little.

export const RATING_WEIGHTS = { 1: -0.8, 2: -0.4, 3: 0.2, 4: 0.8, 5: 1 };

// Movies rated by this many MovieLens users count as crowd favorites.
export const POPULAR_CUTOFF = 60;

/**
 * @param {object} model           the exported model (movies, neighbors)
 * @param {Array<{index:number, stars:number}>} ratings  the user's ratings
 * @param {object} [options]
 * @param {number|null} [options.genre]     only return movies in this genre
 * @param {boolean} [options.hidePopular]   leave out crowd favorites
 * @param {number} [options.limit]          how many picks to return
 * @returns {Array<{index:number, score:number, strength:number, because:number[]}>}
 */
export function recommend(model, ratings, { genre = null, hidePopular = false, limit = 12 } = {}) {
  const rated = new Set(ratings.map((r) => r.index));
  const totals = new Map();

  for (const { index, stars } of ratings) {
    const w = RATING_WEIGHTS[stars] ?? 0;
    if (w === 0) continue;
    for (const [j, link] of model.neighbors[index]) {
      if (rated.has(j)) continue;
      const contribution = w * link;
      const entry = totals.get(j) ?? { score: 0, contributions: [] };
      entry.score += contribution;
      entry.contributions.push([index, contribution]);
      totals.set(j, entry);
    }
  }

  const picks = [];
  for (const [j, { score, contributions }] of totals) {
    if (score <= 0) continue;
    const movie = model.movies[j];
    if (genre !== null && !movie.g.includes(genre)) continue;
    if (hidePopular && movie.n >= POPULAR_CUTOFF) continue;
    const because = contributions
      .filter(([, c]) => c > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([i]) => i);
    picks.push({ index: j, score, because });
  }

  picks.sort((a, b) => b.score - a.score || model.movies[b.index].n - model.movies[a.index].n);
  const top = picks.slice(0, limit);
  const best = top[0]?.score ?? 1;
  return top.map((p) => ({ ...p, strength: p.score / best }));
}
