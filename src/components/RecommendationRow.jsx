import StarRating from './StarRating.jsx';

function joinTitles(titles) {
  return titles.length === 2 ? `${titles[0]} and ${titles[1]}` : titles[0];
}

/**
 * One ranked pick.
 * Props: rank, movie, genreNames, because (titles that led to this pick),
 *        strength (0-1, relative to the top pick), onRate(stars).
 */
export default function RecommendationRow({ rank, movie, genreNames, because, strength, onRate }) {
  return (
    <li className="pick">
      <span className="pick__rank" aria-hidden="true">
        {rank}
      </span>
      <div className="pick__body">
        <h3 className="pick__title">
          {movie.tmdb ? (
            <a href={`https://www.themoviedb.org/movie/${movie.tmdb}`} target="_blank" rel="noreferrer">
              {movie.t}
            </a>
          ) : (
            movie.t
          )}{' '}
          <span className="pick__year">{movie.y}</span>
        </h3>
        <p className="pick__genres">{genreNames.join(', ')}</p>
        {because.length > 0 && <p className="pick__because">Because you liked {joinTitles(because)}</p>}
        <div className="pick__meta">
          <div className="pick__match">
            <span
              className="match"
              role="meter"
              aria-label="Match strength compared with your top pick"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(strength * 100)}
            >
              <span className="match__fill" style={{ width: `${Math.max(strength, 0.04) * 100}%` }} />
            </span>
          </div>
          <span className="pick__crowd">
            {movie.a.toFixed(1)} avg from {movie.n} viewers
          </span>
        </div>
      </div>
      <div className="pick__rate">
        <span className="pick__rate-label">Seen it?</span>
        <StarRating value={0} label={movie.t} size="sm" onChange={onRate} />
      </div>
    </li>
  );
}
