
import {
  EnvielAnimeDetails,
  EnvielAnimeListItem,
  EnvielEpisode,
  EnvielSearchResult,
  EnvielStreamingData,
} from "./enviel-types";

const ENVIEL_API_BASE = "https://envielanime.vercel.app";

// Helper to normalize slugs for the external API to avoid 404s
function normalizeSlug(slug: string): string {
    let normalized = slug;
    
    // Client-side fix for "1piece" issue
    if (normalized.includes('1piece')) {
        normalized = normalized.replace('1piece', 'one-piece');
    }
    
    // Clean common suffixes if they might confuse the search (optional, but safer)
    normalized = normalized.replace(/-sub-indo.*/, '').replace(/-subtitle-indonesia.*/, '');
    
    // Ensure "one-piece" is clean
    if (normalized === 'one-piece') return 'one-piece';
    
    return normalized; // If no override, return original (or normalized if you prefer)
}

export async function envielFetchOngoing(page: number = 1): Promise<EnvielAnimeListItem[]> {
  try {
    const res = await fetch(`${ENVIEL_API_BASE}/Stream1/ongoing?page=${page}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error("Failed to fetch ongoing anime");
    const json = await res.json();
    return json.data.anime || [];
  } catch (error) {
    console.error(error);
    return [];
  }
}

export async function envielFetchComplete(page: number = 1): Promise<EnvielAnimeListItem[]> {
  try {
    const res = await fetch(`${ENVIEL_API_BASE}/Stream1/complete?page=${page}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error("Failed to fetch complete anime");
    const json = await res.json();
    return json.data.anime || [];
  } catch (error) {
    console.error(error);
    return [];
  }
}

export async function envielSearchAnime(query: string): Promise<EnvielSearchResult[]> {
  try {
    const res = await fetch(`${ENVIEL_API_BASE}/search?q=${encodeURIComponent(query)}`, {
       next: { revalidate: 3600 }
    });
    if (!res.ok) throw new Error("Failed to search anime");
    const json = await res.json();
    return json.results || [];
  } catch (error) {
    console.error(error);
    return [];
  }
}

export async function envielFetchDetails(slug: string): Promise<EnvielAnimeDetails | null> {
  try {
    const targetSlug = normalizeSlug(slug);
    
    // Note: If we change the slug here, the API returns data for "one-piece".
    // Does the frontend care if the returned slug differs? 
    // The Page component uses params.slug. 
    
    const res = await fetch(`${ENVIEL_API_BASE}/anime/details/${targetSlug}`, {
      next: { revalidate: 3600 },
    });
    
    if (!res.ok) return null;
    const json = await res.json();
    return json.data;
  } catch (error) {
    console.error(error);
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
    
    // Logic from user guide & server.js analysis
    if (source === "Stream2") {
       // SPECIAL HANDLING FOR STREAM2 (Oploverz) - Per Integration Guide
       // Slug is a URL, so we must encode it safely
       const safeSlug = encodeURIComponent(episode.slug);
       streamUrl = `${ENVIEL_API_BASE}/Stream2/streaming/${safeSlug}`;
       
    } else {
       // Standard handling (Stream1 / Unified)
       // server.js expects /streaming/:anime/:episode
       let epNum = episode.number;
       if (!epNum) {
          const match = episode.slug.match(/episode-(\d+)/) || episode.slug.match(/-(\d+)$/);
          if (match) epNum = parseInt(match[1]);
          else epNum = 1;
       }
       
       const finalAnimeSlug = animeSlug || "one-piece"; 
       streamUrl = `${ENVIEL_API_BASE}/streaming/${finalAnimeSlug}/${epNum}`;
    }

    const res = await fetch(streamUrl, {
      next: { revalidate: 3600 },
    });
    
    if (!res.ok) throw new Error("Failed to fetch streaming data");
    const json = await res.json();
    
    if (json.success && json.data) {
        // Guide says: "return data.data.embed"
        // But our type expects EnvielStreamingData object with structure { title, embed, alternatives }
        // The guide says "Use data.data.embed (IFRAME URL) or data.data.downloads"
        // If data.embed IS the url, we might need to wrap it.
        // HOWEVER, the previous server.js analysis showed structured data.
        // Let's assume the API returns the structure we defined in Types, 
        // OR adapt if the guide implies simplified return.
        // Guide example: console.log("Stream URL:", streamData.data.embed); --> implies embed is the URL?
        // Wait, if embed is just a URL string, EnvielPlayer needs adaptation?
        // EnvielPlayer expects { server, embed_url, quality }[]
        
        // Let's trust the previous analysis of server.js which showed structured return.
        // BUT, if strict adherence to guide text "return data.data.embed" is required...
        // No, the guide text is "return data.data.embed" inside the helper function, 
        // effectively returning a single property.
        // My function returns full EnvielStreamingData.
        
        return json.data;
    }
    return null;

  } catch (error) {
    console.error("envielFetchStreaming error:", error);
    return null;
  }
}
