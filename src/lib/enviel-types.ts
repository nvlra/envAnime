export interface EnvielAnimeListItem {
  title: string;
  slug: string;
  poster: string;
  episode?: string;
}

export interface EnvielSearchResult {
  title: string;
  slug: string;
  poster: string;
  sources: string[];
  source_slugs: Record<string, string>;
}

export interface EnvielAnimeDetails {
  title: string;
  poster: string;
  synopsis?: string;
  episodes: EnvielEpisode[];
}

export interface EnvielEpisode {
  number: number;
  title: string;
  slug: string;
  source?: string;
  streams?: { source: string; slug: string }[];
}

export interface EnvielStreamingData {
  title?: string;
  embed?: { server: string; embed_url: string; quality?: string };
  alternatives?: { server: string; embed_url: string; quality?: string }[];
}
