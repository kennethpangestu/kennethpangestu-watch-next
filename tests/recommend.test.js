import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { recommend, POPULAR_CUTOFF } from '../src/lib/recommend.js';
import { buildSearchIndex, searchMovies, findByTitle } from '../src/lib/catalog.js';
import { SAMPLE_PROFILES } from '../src/data/profiles.js';

const model = JSON.parse(readFileSync(new URL('../src/data/model.json', import.meta.url)));
const idx = (title) => findByTitle(model.movies, title);

test('every sample profile title is in the catalog', () => {
  for (const profile of SAMPLE_PROFILES) {
    for (const [title] of profile.ratings) {
      assert.ok(idx(title) >= 0, `${title} is missing`);
    }
  }
});

test('no ratings means no picks', () => {
  assert.deepEqual(recommend(model, []), []);
});

test('liking Toy Story recommends Toy Story 2, and never a rated movie', () => {
  const ratings = [{ index: idx('Toy Story'), stars: 5 }];
  const picks = recommend(model, ratings);
  const titles = picks.map((p) => model.movies[p.index].t);
  assert.ok(titles.slice(0, 3).includes('Toy Story 2'), titles.join(', '));
  assert.ok(!titles.includes('Toy Story'));
  assert.equal(picks[0].strength, 1);
  assert.deepEqual(picks[0].because, [idx('Toy Story')]);
});

test('a low rating pushes neighbors down', () => {
  const liked = recommend(model, [{ index: idx('Toy Story'), stars: 5 }], { limit: 50 });
  const disliked = recommend(model, [{ index: idx('Toy Story'), stars: 1 }], { limit: 50 });
  assert.ok(liked.length > 0);
  assert.equal(disliked.length, 0);
});

test('genre and popularity filters are respected', () => {
  const ratings = SAMPLE_PROFILES[0].ratings.map(([t, stars]) => ({ index: idx(t), stars }));
  const horror = model.genres.indexOf('Horror');
  for (const p of recommend(model, ratings, { genre: horror })) {
    assert.ok(model.movies[p.index].g.includes(horror));
  }
  for (const p of recommend(model, ratings, { hidePopular: true })) {
    assert.ok(model.movies[p.index].n < POPULAR_CUTOFF);
  }
});

test('search ignores case and accents and skips excluded movies', () => {
  const searchIndex = buildSearchIndex(model.movies);
  assert.equal(searchMovies(searchIndex, 'matrix')[0], idx('The Matrix'));
  assert.ok(searchMovies(searchIndex, 'amelie').includes(idx('Amelie')));
  assert.ok(!searchMovies(searchIndex, 'matrix', { exclude: new Set([idx('The Matrix')]) }).includes(idx('The Matrix')));
  assert.deepEqual(searchMovies(searchIndex, 'm'), []);
});
