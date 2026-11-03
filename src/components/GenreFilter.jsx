/**
 * Single-choice genre chips.
 * Props: genres ([{index, name}]), selected (genre index or null), onSelect(index | null).
 */
export default function GenreFilter({ genres, selected, onSelect }) {
  return (
    <div className="genres" role="group" aria-label="Filter by genre">
      <button
        type="button"
        className="chip chip--small"
        aria-pressed={selected === null}
        onClick={() => onSelect(null)}
      >
        All genres
      </button>
      {genres.map((g) => (
        <button
          key={g.index}
          type="button"
          className="chip chip--small"
          aria-pressed={selected === g.index}
          onClick={() => onSelect(selected === g.index ? null : g.index)}
        >
          {g.name}
        </button>
      ))}
    </div>
  );
}
