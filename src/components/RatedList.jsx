import StarRating from './StarRating.jsx';

/**
 * The movies you've rated, newest first.
 * Props: movies, ratings ([{index, stars}]), onRate(index, stars), onRemove(index).
 */
export default function RatedList({ movies, ratings, onRate, onRemove }) {
  return (
    <ul className="rated">
      {ratings.map(({ index, stars }) => {
        const m = movies[index];
        return (
          <li key={index} className="rated__item">
            <div className="rated__title">
              {m.t} <span className="rated__year">{m.y}</span>
            </div>
            <StarRating value={stars} label={m.t} size="sm" onChange={(s) => onRate(index, s)} />
            <button
              type="button"
              className="rated__remove"
              aria-label={`Remove ${m.t}`}
              onClick={() => onRemove(index)}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
