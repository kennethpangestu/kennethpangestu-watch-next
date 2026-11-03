import { useId, useMemo, useState } from 'react';
import { searchMovies } from '../lib/catalog.js';

/**
 * Type-ahead search that adds a movie to your ratings.
 * Props: movies, searchIndex, exclude (Set of movie indices already rated), onPick(index).
 */
export default function SearchBox({ movies, searchIndex, exclude, onPick }) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const listId = useId();

  const results = useMemo(
    () => searchMovies(searchIndex, query, { exclude }),
    [searchIndex, query, exclude],
  );
  const open = results.length > 0;

  function pick(index) {
    onPick(index);
    setQuery('');
    setActive(0);
  }

  function onKeyDown(e) {
    if (!open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => (a + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => (a - 1 + results.length) % results.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      pick(results[active]);
    } else if (e.key === 'Escape') {
      setQuery('');
    }
  }

  return (
    <div className="search">
      <label className="search__label" htmlFor={`${listId}-input`}>
        Add a movie you've seen
      </label>
      <input
        id={`${listId}-input`}
        className="search__input"
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open ? `${listId}-${active}` : undefined}
        placeholder="Search 1,650 movies"
        autoComplete="off"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setActive(0);
        }}
        onKeyDown={onKeyDown}
      />
      {open && (
        <ul className="search__results" id={listId} role="listbox">
          {results.map((index, i) => {
            const m = movies[index];
            return (
              <li
                key={index}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === active}
                className={i === active ? 'search__option search__option--active' : 'search__option'}
                onMouseMove={() => setActive(i)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(index);
                }}
              >
                <span>{m.t}</span>
                <span className="search__year">{m.y}</span>
              </li>
            );
          })}
        </ul>
      )}
      {query.trim().length >= 2 && !open && (
        <p className="search__empty">No movie in the catalog matches “{query.trim()}”. Try another title.</p>
      )}
    </div>
  );
}
