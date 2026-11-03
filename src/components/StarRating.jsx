import { useState } from 'react';

const STAR_PATH =
  'M12 2.8l2.83 5.73 6.33.92-4.58 4.46 1.08 6.3L12 17.24l-5.66 2.97 1.08-6.3-4.58-4.46 6.33-.92z';

/**
 * Five clickable stars.
 * Props: value (0-5), onChange(stars), label (movie title, for screen readers), size ('sm' | 'md').
 */
export default function StarRating({ value = 0, onChange, label, size = 'md' }) {
  const [hovered, setHovered] = useState(0);
  const shown = hovered || value;

  return (
    <div
      className={`stars stars--${size}`}
      role="group"
      aria-label={`Your rating for ${label}`}
      onMouseLeave={() => setHovered(0)}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          className={n <= shown ? 'star star--on' : 'star'}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
          aria-pressed={n === value}
          onMouseEnter={() => setHovered(n)}
          onFocus={() => setHovered(n)}
          onBlur={() => setHovered(0)}
          onClick={() => onChange(n)}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d={STAR_PATH} />
          </svg>
        </button>
      ))}
    </div>
  );
}
