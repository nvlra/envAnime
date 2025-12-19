import {
  EnvielAnimeDetails,
  EnvielAnimeListItem,
  EnvielSearchResult,
  EnvielStreamingData,
  EnvielEpisode,
} from "./enviel-types";

const ENVIEL_API_BASE = "https://envielanime.vercel.app";

export async function envielFetchOngoing(page: number = 1): Promise<EnvielAnimeListItem[]> {
  try {
    const res = await fetch(`${ENVIEL_API_BASE}/Stream1/ongoing?page=${page}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error("Failed to fetch ongoing anime");
    const data = await res.json();
    return data.data.anime || [];
  } catch (error) {
    console.error("envielFetchOngoing error:", error);
    return [];
  }
}

export async function envielFetchComplete(page: number = 1): Promise<EnvielAnimeListItem[]> {
  try {
    const res = await fetch(`${ENVIEL_API_BASE}/Stream1/complete?page=${page}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error("Failed to fetch complete anime");
    const data = await res.json();
    return data.data.anime || [];
  } catch (error) {
    console.error("envielFetchComplete error:", error);
    return [];
  }
}

export async function envielSearchAnime(query: string): Promise<EnvielSearchResult[]> {
  try {
    const res = await fetch(`${ENVIEL_API_BASE}/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error("Search failed");
    const data = await res.json();
    return data.results || [];
  } catch (error) {
    console.error("envielSearchAnime error:", error);
    return [];
  }
}

export async function envielFetchDetails(slug: string): Promise<EnvielAnimeDetails | null> {
  try {
    const res = await fetch(`${ENVIEL_API_BASE}/anime/details/${slug}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error("Failed to fetch details");
    const json = await res.json();
    return json.success ? json.data : null;
  } catch (error) {
    console.error("envielFetchDetails error:", error);
    return null;
  }
}

export async function envielFetchStreaming(
  source: string,
  episode: EnvielEpisode,
  animeSlug?: string
): Promise<EnvielStreamingData | null> {
  try {
    let streamUrl = "";
    
    // Logic from user guide
    if (source === "Stream2") {
       const safeSlug = encodeURIComponent(episode.slug);
       streamUrl = `${ENVIEL_API_BASE}/Stream2/streaming/${safeSlug}`;
    } else {
       // Standard handling
       let epNum = episode.number;
       if (!epNum) {
          const match = episode.slug.match(/episode-(\d+)/) || episode.slug.match(/-(\d+)$/);
          if (match) epNum = parseInt(match[1]);
          else epNum = 1;
       }
       
       const finalAnimeSlug = animeSlug || "one-piece"; // Fallback as per guide example, though risky
       streamUrl = `${ENVIEL_API_BASE}/streaming/${finalAnimeSlug}/${epNum}`;
    }

    const res = await fetch(streamUrl, {
      next: { revalidate: 3600 },
    });
    
    if (!res.ok) throw new Error("Failed to fetch streaming data");
    const json = await res.json();
    
    if (json.success && json.data) {
        // Normalize response to match our types
        const data = json.data;
        // Check if embed is string or object (guide ambiguity resolved by checking server.js)
        // server.js returns embed as object.
        return {
            title: data.title,
            embed: data.embed, 
            alternatives: data.alternatives
        };
    }
    return null;

  } catch (error) {
    console.error("envielFetchStreaming error:", error);
    return null;
  }
}
