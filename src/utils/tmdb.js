import AsyncStorage from "@react-native-async-storage/async-storage";

const TMDB_KEY = process.env.EXPO_PUBLIC_TMDB_API_KEY;
const SEARCH_URL = "https://api.themoviedb.org/3/search/movie";
const IMG_BASE = "https://image.tmdb.org/t/p/w500";
const CACHE_KEY = "tmdb-poster-cache-v1";

async function searchPoster(searchTitle, year) {
  const params = new URLSearchParams({
    api_key: TMDB_KEY,
    query: searchTitle,
    language: "en-US",
    page: "1",
    ...(year ? { primary_release_year: String(year) } : {}),
  });

  const res = await fetch(`${SEARCH_URL}?${params}`);
  if (!res.ok) return null;

  const data = await res.json();
  const path = data.results?.[0]?.poster_path;
  return path ? `${IMG_BASE}${path}` : null;
}

/**
 * Fetch poster URL for a single movie by name.
 * Used for on-demand generated stories.
 */
export async function fetchMoviePoster(movieName) {
  if (!TMDB_KEY) return null;
  return searchPoster(movieName).catch(() => null);
}

/**
 * Fetch poster URLs for all movies in movieMeta.
 * Results are cached in AsyncStorage so TMDB is only hit once.
 * Returns an object keyed by movieName → poster URL string.
 */
export async function fetchAllPosters(movieMeta) {
  if (!TMDB_KEY) return {};

  // Return cached data if available
  try {
    const cached = await AsyncStorage.getItem(CACHE_KEY);
    if (cached) return JSON.parse(cached);
  } catch (_) {}

  // Fetch all in parallel
  const entries = await Promise.all(
    Object.entries(movieMeta).map(async ([name, meta]) => {
      const url = await searchPoster(meta.searchTitle || name, meta.year).catch(() => null);
      return [name, url];
    })
  );

  const results = Object.fromEntries(entries.filter(([, url]) => url));

  // Cache for subsequent launches
  try {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(results));
  } catch (_) {}

  return results;
}
