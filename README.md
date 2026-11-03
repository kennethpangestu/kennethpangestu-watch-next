# Watch Next

**Rate a few movies you've seen and get personalized picks, instantly, in your browser.**

**Live demo:** https://kennethpangestu.github.io/kennethpangestu-watch-next/

Watch Next turns my [movie-recommender](https://github.com/kennethpangestu/movie-recommender) analysis into a product. That project compared four recommenders on 100,836 MovieLens ratings and found EASE scored best (1.58× a most-popular baseline on NDCG@10). This app ships that model as a React front end: no server, no sign-up, recommendations update the moment you rate something.

## Features

- **Search and rate:** type-ahead search over 1,650 movies (ignores case and accents, keyboard friendly), then rate with 1–5 stars.
- **Explained picks:** every recommendation says which of your movies led to it ("Because you liked Finding Nemo and Up") and shows its match strength relative to your top pick.
- **Rate from the list:** seen a pick already? Rate it in place; it moves into your ratings and the list re-ranks.
- **Filters:** narrow to one genre, or skip crowd favorites to surface lesser-known movies.
- **Sample tastes:** four starter profiles so first-time visitors see results in one click.
- **Remembers you:** ratings are saved in your browser's local storage.
- **Accessible and responsive:** works from phone to desktop, in light and dark mode, with visible keyboard focus.

## How it works

**The model.** EASE (Steck, 2019) learns an item-to-item weight matrix *B* in closed form, `B = I − P / diag(P)` with `P = (XᵀX + λI)⁻¹`, where *X* marks which movies each user rated 4 stars or higher (λ = 200, as tuned in the original analysis). A user's score for movie *j* is the sum of `B[i, j]` over the movies *i* they liked.

**Fitting it in a browser.** The full 1,650 × 1,650 matrix is too large to ship, so [`scripts/build_model.py`](scripts/build_model.py) keeps each movie's 25 strongest positive links and exports them as compact JSON (about 145 KB gzipped).

**Scoring.** [`src/lib/recommend.js`](src/lib/recommend.js) sums those links over your ratings, weighted by stars: 5 and 4 stars pull neighbors up, 3 nudges them slightly, 2 and 1 push them down. Movies you've already rated are excluded, and the top contributing ratings become the "Because you liked…" explanation.

## Built with

React 19 and Vite, plain CSS, Python (NumPy, pandas) for model training, Node's built-in test runner, and GitHub Actions for testing and deploying to GitHub Pages.

### Component structure

`App` owns all state (ratings, genre filter, popularity toggle) and passes data and callbacks down as props:

| Component | Props it receives | What it does |
|---|---|---|
| `SearchBox` | `movies`, `searchIndex`, `exclude`, `onPick` | Type-ahead search; calls `onPick` with the chosen movie |
| `RatedList` | `movies`, `ratings`, `onRate`, `onRemove` | Your rated movies, with editable stars |
| `SampleProfiles` | `profiles`, `onLoad` | One-click starter tastes |
| `GenreFilter` | `genres`, `selected`, `onSelect` | Genre chips |
| `RecommendationList` | `movies`, `genres`, `picks`, `onRate` | Maps picks to rows |
| `RecommendationRow` | `rank`, `movie`, `genreNames`, `because`, `strength`, `onRate` | One ranked pick with its explanation |
| `StarRating` | `value`, `onChange`, `label`, `size` | Reusable 5-star control used in both lists |

## Run it locally

```bash
npm install
npm run dev       # start the dev server
npm test          # recommender and search tests
npm run build     # production build in dist/
```

To retrain the model from the MovieLens files:

```bash
python scripts/build_model.py path/to/ml-latest-small src/data/model.json
```

## Data

MovieLens ml-latest-small, GroupLens Research, University of Minnesota. F. Maxwell Harper and Joseph A. Konstan. 2015. *The MovieLens Datasets: History and Context.* ACM Transactions on Interactive Intelligent Systems 5(4). Used for non-commercial purposes under the MovieLens license. Movie links point to The Movie Database (TMDB).

## Author

Kenneth Pangestu, Data Science, University of Washington. [LinkedIn](https://www.linkedin.com/in/kennethpangestu) · [GitHub](https://github.com/kennethpangestu)
