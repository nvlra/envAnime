import { envielFetchStreaming, envielFetchDetails } from "@/lib/enviel-api";
import { WatchView } from "@/components/views/WatchView";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{
    source: string;
    episodeSlug: string | string[];
  }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function WatchPage(props: PageProps) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  let { source, episodeSlug } = params;
  
  // Handle catch-all segment
  if (Array.isArray(episodeSlug)) {
      episodeSlug = episodeSlug.map(s => decodeURIComponent(s)).join("/");
  } else {
      episodeSlug = decodeURIComponent(episodeSlug);
  }
  const animeSlug = searchParams.anime as string | undefined;

  // Fetch Anime Details (Episode List) if anime slug is provided
  let episodes = undefined;
  if (animeSlug) {
      const details = await envielFetchDetails(animeSlug);
      if (details) {
          episodes = details.episodes;
      }
  }

  // Construct minimal episode object for fetcher
  const episodeObj = {
      slug: episodeSlug,
      title: "",
      number: 0,
      source: source,
  };

  // Fetch Streaming Data
  const streamData = await envielFetchStreaming(source, episodeObj, animeSlug);

  if (!streamData) return notFound();

  return <WatchView 
      streamData={streamData} 
      episodes={episodes} 
      animeSlug={animeSlug} 
      source={source} 
      currentEpisodeSlug={episodeSlug} 
  />;
}
