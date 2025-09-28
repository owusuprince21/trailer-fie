export interface Movie {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  adult: boolean;
  original_language: string;
  popularity: number;
  video: boolean;
}

export interface TVShow {
  id: number;
  name: string;
  original_name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  adult: boolean;
  original_language: string;
  popularity: number;
  origin_country: string[];
}

export interface Person {
  id: number;
  name: string;
  profile_path: string | null;
  adult: boolean;
  popularity: number;
  known_for_department: string;
  known_for: (Movie | TVShow)[];
}

export interface Genre {
  id: number;
  name: string;
}

export interface Video {
  id: string;
  iso_639_1: string;
  iso_3166_1: string;
  key: string;
  name: string;
  official: boolean;
  published_at: string;
  site: string;
  size: number;
  type: string;
}

export interface Cast {
  id: number;
  name: string;
  character: string;
  credit_id: string;
  order: number;
  adult: boolean;
  gender: number | null;
  known_for_department: string;
  original_name: string;
  popularity: number;
  profile_path: string | null;
  cast_id: number;
}

export interface MovieDetails extends Movie {
  genres: Genre[];
  runtime: number;
  status: string;
  tagline: string;
  budget: number;
  revenue: number;
  production_countries: Array<{ iso_3166_1: string; name: string }>;
  production_companies: Array<{ id: number; name: string; logo_path: string | null; origin_country: string }>;
  spoken_languages: Array<{ iso_639_1: string; english_name: string; name: string }>;
}

export interface TVDetails extends TVShow {
  genres: Genre[];
  episode_run_time: number[];
  status: string;
  tagline: string;
  type: string;
  number_of_episodes: number;
  number_of_seasons: number;
  seasons: Array<{
    id: number;
    name: string;
    overview: string;
    poster_path: string | null;
    season_number: number;
    episode_count: number;
    air_date: string;
  }>;
  networks: Array<{ id: number; name: string; logo_path: string | null; origin_country: string }>;
  production_companies: Array<{ id: number; name: string; logo_path: string | null; origin_country: string }>;
  production_countries: Array<{ iso_3166_1: string; name: string }>;
  spoken_languages: Array<{ iso_639_1: string; english_name: string; name: string }>;
}

const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

export const getImageUrl = (path: string | null, size: string = 'w500'): string => {
  if (!path) return '/placeholder-image.jpg';
  return `${TMDB_IMAGE_BASE_URL}/${size}${path}`;
};

export const getBackdropUrl = (path: string | null, size: string = 'w1280'): string => {
  if (!path) return '/placeholder-backdrop.jpg';
  return `${TMDB_IMAGE_BASE_URL}/${size}${path}`;
};

// Client-side helpers that call our API routes
export const tmdbApi = {
  getTrending: async (mediaType: 'movie' | 'tv', timeWindow: 'day' | 'week') => {
    const response = await fetch(`/api/tmdb/trending/${mediaType}/${timeWindow}`);
    return response.json();
  },

  getPopular: async (mediaType: 'movie' | 'tv') => {
    const response = await fetch(`/api/tmdb/${mediaType}/popular`);
    return response.json();
  },

  getMovieDetails: async (id: number) => {
    const response = await fetch(`/api/tmdb/movie/${id}`);
    return response.json();
  },

  getTVDetails: async (id: number) => {
    const response = await fetch(`/api/tmdb/tv/${id}`);
    return response.json();
  },

  getMovieCredits: async (id: number) => {
    const response = await fetch(`/api/tmdb/movie/${id}/credits`);
    return response.json();
  },

  getTVCredits: async (id: number) => {
    const response = await fetch(`/api/tmdb/tv/${id}/credits`);
    return response.json();
  },

  getMovieVideos: async (id: number) => {
    const response = await fetch(`/api/tmdb/movie/${id}/videos`);
    return response.json();
  },

  getTVVideos: async (id: number) => {
    const response = await fetch(`/api/tmdb/tv/${id}/videos`);
    return response.json();
  },

  getMovieRecommendations: async (id: number) => {
    const response = await fetch(`/api/tmdb/movie/${id}/recommendations`);
    return response.json();
  },

  getTVRecommendations: async (id: number) => {
    const response = await fetch(`/api/tmdb/tv/${id}/recommendations`);
    return response.json();
  },

  searchMulti: async (query: string) => {
    const response = await fetch(`/api/tmdb/search/multi?query=${encodeURIComponent(query)}`);
    return response.json();
  },

  getPopularPeople: async () => {
    const response = await fetch('/api/tmdb/person/popular');
    return response.json();
  },

  getPerson: async (id: number) => {
    const response = await fetch(`/api/tmdb/person/${id}`);
    return response.json();
  },

  getNowPlaying: async () => {
    const response = await fetch('/api/tmdb/movie/now_playing');
    return response.json();
  },

  getUpcoming: async () => {
    const response = await fetch('/api/tmdb/movie/upcoming');
    return response.json();
  },

  getTopRated: async (mediaType: 'movie' | 'tv') => {
    const response = await fetch(`/api/tmdb/${mediaType}/top_rated`);
    return response.json();
  },

  getAiringToday: async () => {
    const response = await fetch('/api/tmdb/tv/airing_today');
    return response.json();
  },

  getOnTheAir: async () => {
    const response = await fetch('/api/tmdb/tv/on_the_air');
    return response.json();
  },

  discover: async (mediaType: 'movie' | 'tv', params: Record<string, string> = {}) => {
    const searchParams = new URLSearchParams(params);
    const response = await fetch(`/api/tmdb/discover/${mediaType}?${searchParams}`);
    return response.json();
  }
};



// ✅ Format release year from a date string
export const formatYear = (date: string | undefined | null): string => {
  if (!date) return 'N/A';
  return new Date(date).getFullYear().toString();
};

// ✅ Format vote average (optional helper)
export const formatVoteAverage = (vote: number | undefined | null): string => {
  if (!vote && vote !== 0) return 'N/A';
  return vote.toFixed(1);
};

// ✅ Get score color (optional helper)
export const getVoteAverageColor = (vote: number | undefined | null): string => {
  if (!vote && vote !== 0) return 'gray';
  if (vote >= 7.5) return 'green';
  if (vote >= 5) return 'orange';
  return 'red';
};


// Format release date (YYYY-MM-DD → Month Day, Year)
export const formatDate = (dateString: string): string => {
  if (!dateString) return 'Unknown';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

// Convert runtime in minutes → "Xh Ym"
export const formatRuntime = (minutes: number): string => {
  if (!minutes) return '-';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
};
