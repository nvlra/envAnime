"use client";

import { EnvielAnimeDetails } from "@/lib/enviel-types";
import { EnvielEpisodeList } from "@/components/ui/EnvielEpisodeList";
import { Image, Button } from "@heroui/react";
import { Play, Star } from "lucide-react";
import Link from "next/link";

interface AnimeDetailViewProps {
  details: EnvielAnimeDetails | null;
  slug: string;
}

export function AnimeDetailView({ details, slug }: AnimeDetailViewProps) {
  if (!details) {
     return (
       <div className="min-h-screen pt-32 text-center text-white">
         <h1 className="text-2xl font-bold">Anime Not Found</h1>
         <p className="text-neutral-400">Could not retrieve details for {slug}</p>
       </div>
     );
  }

  const firstEpisode = details.episodes.length > 0 ? details.episodes[0] : null;

  return (
    <div className="min-h-screen relative bg-[#050505] overflow-hidden">
      {/* Background Blur */}
      <div 
         className="absolute inset-0 bg-cover bg-center opacity-30 blur-3xl z-0"
         style={{ backgroundImage: `url(${details.poster})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/80 to-transparent z-0" />
      
      <div className="relative z-10 pt-24 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
           
           {/* Poster & Actions */}
           <div className="lg:col-span-4 space-y-6">
              <div className="relative aspect-[2/3] rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                <Image
                  src={details.poster}
                  alt={details.title}
                  classNames={{
                    wrapper: "w-full h-full",
                    img: "w-full h-full object-cover"
                  }}
                />
              </div>
              
              <div className="flex flex-col gap-3">
                {firstEpisode && (
                  <Button 
                    as={Link}
                    href={`/watch/Stream1/${firstEpisode.slug}?anime=${slug}`}
                    size="lg"
                    className="w-full bg-enviel-500 font-bold text-white shadow-lg shadow-enviel-500/20"
                    startContent={<Play fill="currentColor" />}
                  >
                    Watch Now
                  </Button>
                )}
              </div>
           </div>

           {/* Info & Episodes */}
           <div className="lg:col-span-8 space-y-8">
              <div>
                <h1 className="text-4xl md:text-6xl font-bold text-white mb-2">{details.title}</h1>
                <div className="flex items-center gap-4 text-sm text-neutral-300">
                    <span className="bg-white/10 px-3 py-1 rounded-full border border-white/5">TV Series</span>
                    <span className="flex items-center gap-1"><Star size={16} className="text-yellow-500 fill-yellow-500" /> 4.8</span>
                    <span>{details.episodes.length} Episodes</span>
                </div>
              </div>

              {details.synopsis && (
                <div className="space-y-2">
                   <h3 className="text-lg font-semibold text-white">Synopsis</h3>
                   <p className="text-neutral-300 leading-relaxed text-sm md:text-base">
                     {details.synopsis}
                   </p>
                </div>
              )}

              {/* Episodes Card */}
              <div className="pt-4">
                 <EnvielEpisodeList 
                    episodes={details.episodes} 
                    source="Stream1"
                    animeSlug={slug}
                 />
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
