/**
 * Buttons that load a ready-made set of ratings.
 * Props: profiles ([{name}]), onLoad(profile).
 */
export default function SampleProfiles({ profiles, onLoad }) {
  return (
    <div className="samples">
      <p className="samples__intro">Or start from a sample taste:</p>
      <div className="samples__buttons">
        {profiles.map((p) => (
          <button key={p.name} type="button" className="chip" onClick={() => onLoad(p)}>
            {p.name}
          </button>
        ))}
      </div>
    </div>
  );
}
