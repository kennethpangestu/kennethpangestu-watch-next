import { useEffect, useMemo, useState } from 'react';
import model from './data/model.json';
import { SAMPLE_PROFILES } from './data/profiles.js';
import { buildSearchIndex, findByTitle } from './lib/catalog.js';
import { recommend, POPULAR_CUTOFF } from './lib/recommend.js';
import SearchBox from './components/SearchBox.jsx';
import RatedList from './components/RatedList.jsx';
import SampleProfiles from './components/SampleProfiles.jsx';
import GenreFilter from './components/GenreFilter.jsx';
import RecommendationList from './components/RecommendationList.jsx';

const STORAGE_KEY = 'watch-next:ratings';
const searchIndex = buildSearchIndex(model.movies);
const filterGenres = model.genres
  .map((name, index) => ({ name, index }))
  .filter((g) => g.name !== 'IMAX');

function loadSavedRatings() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    return Array.isArray(saved) ? saved.filter((r) => model.movies[r.index]) : [];
  } catch {
    return [];
  }
}

export default function App() {
  const [ratings, setRatings] = useState(loadSavedRatings);
  const [genre, setGenre] = useState(null);
  const [hidePopular, setHidePopular] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ratings));
    } catch {
      // Storage can be unavailable (private windows); ratings still work for this visit.
    }
  }, [ratings]);

  const ratedSet = useMemo(() => new Set(ratings.map((r) => r.index)), [ratings]);
  const picks = useMemo(
    () => recommend(model, ratings, { genre, hidePopular, limit: 12 }),
    [ratings, genre, hidePopular],
  );

  function rate(index, stars) {
    setRatings((current) =>
      current.some((r) => r.index === index)
        ? current.map((r) => (r.index === index ? { ...r, stars } : r))
        : [{ index, stars }, ...current],
    );
  }

  function remove(index) {
    setRatings((current) => current.filter((r) => r.index !== index));
  }

  function loadProfile(profile) {
    setRatings(
      profile.ratings
        .map(([title, stars]) => ({ index: findByTitle(model.movies, title), stars }))
        .filter((r) => r.index >= 0),
    );
    setGenre(null);
  }

  const { meta } = model;

  return (
    <div className="page">
      <header className="masthead">
        <h1 className="masthead__title">Watch Next</h1>
        <p className="masthead__lede">
          Rate a few movies you've seen and get picks from a recommender trained on{' '}
          {meta.ratings.toLocaleString()} MovieLens ratings. It runs entirely in your browser.
        </p>
      </header>

      <main className="layout">
        <section className="panel" aria-labelledby="your-ratings">
          <div className="panel__head">
            <h2 id="your-ratings" className="section-title">
              Your ratings
            </h2>
            {ratings.length > 0 && (
              <button type="button" className="text-button" onClick={() => setRatings([])}>
                Clear all
              </button>
            )}
          </div>
          <SearchBox movies={model.movies} searchIndex={searchIndex} exclude={ratedSet} onPick={(i) => rate(i, 4)} />
          {ratings.length > 0 ? (
            <RatedList movies={model.movies} ratings={ratings} onRate={rate} onRemove={remove} />
          ) : (
            <SampleProfiles profiles={SAMPLE_PROFILES} onLoad={loadProfile} />
          )}
        </section>

        <section className="results" aria-labelledby="picks-title" aria-live="polite">
          <div className="results__head">
            <h2 id="picks-title" className="section-title">
              Recommended for you
            </h2>
            <label className="toggle">
              <input type="checkbox" checked={hidePopular} onChange={(e) => setHidePopular(e.target.checked)} />
              <span>Skip crowd favorites</span>
            </label>
          </div>
          <GenreFilter genres={filterGenres} selected={genre} onSelect={setGenre} />

          {ratings.length === 0 && (
            <div className="empty">
              <p className="empty__title">Your picks will appear here.</p>
              <p>
                Search for a movie you've seen, or load a sample taste. Three or four ratings are enough for a good
                list, and every rating you add sharpens it.
              </p>
            </div>
          )}
          {ratings.length > 0 && picks.length === 0 && (
            <div className="empty">
              <p className="empty__title">No picks match these filters.</p>
              <p>Choose another genre, turn off “Skip crowd favorites”, or rate a few more movies.</p>
            </div>
          )}
          {picks.length > 0 && (
            <RecommendationList movies={model.movies} genres={model.genres} picks={picks} onRate={rate} />
          )}
          {hidePopular && picks.length > 0 && (
            <p className="note">Leaving out movies rated by {POPULAR_CUTOFF} or more MovieLens viewers.</p>
          )}
        </section>
      </main>

      <footer className="about" id="how-it-works">
        <div className="about__col">
          <h2 className="section-title">How it works</h2>
          <p>
            The model is EASE (Steck, 2019), a linear autoencoder that learns how strongly liking one movie predicts
            liking another. It was trained on every 4- and 5-star rating from {meta.users} MovieLens users. In an
            offline test on each user's most recent ratings it scored 1.58× a most-popular baseline on NDCG@10.
          </p>
          <p>
            To run in a browser, each movie keeps only its {meta.topK} strongest links. Your ratings are summed over
            those links: 4 and 5 stars pull similar movies up, 1 and 2 stars push them down. Your ratings are saved
            in this browser only.
          </p>
        </div>
        <div className="about__col">
          <h2 className="section-title">About</h2>
          <p>
            Built by Kenneth Pangestu with React and Vite. The model training and evaluation are in the{' '}
            <a href="https://github.com/kennethpangestu/movie-recommender">movie-recommender</a> repo; the app's code
            is in <a href="https://github.com/kennethpangestu/kennethpangestu-watch-next">watch-next</a>.
          </p>
          <p className="about__credit">
            Data: MovieLens ml-latest-small, GroupLens Research, University of Minnesota (Harper and Konstan, 2015).
            Movie links go to The Movie Database.
          </p>
        </div>
      </footer>
    </div>
  );
}
