import RecommendationRow from './RecommendationRow.jsx';

/**
 * The ranked list of picks.
 * Props: movies, genres (all genre names), picks (from recommend()), onRate(index, stars).
 */
export default function RecommendationList({ movies, genres, picks, onRate }) {
  return (
    <ol className="picks">
      {picks.map((p, i) => (
        <RecommendationRow
          key={p.index}
          rank={i + 1}
          movie={movies[p.index]}
          genreNames={movies[p.index].g.map((g) => genres[g])}
          because={p.because.map((b) => movies[b].t)}
          strength={p.strength}
          onRate={(stars) => onRate(p.index, stars)}
        />
      ))}
    </ol>
  );
}
