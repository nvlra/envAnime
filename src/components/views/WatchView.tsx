"use client";

import { EnvielStreamingData, EnvielEpisode } from "@/lib/enviel-types";
import { EnvielPlayer } from "@/components/ui/EnvielPlayer";
import { EnvielEpisodeList } from "@/components/ui/EnvielEpisodeList";
import { Button } from "@heroui/react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface WatchViewProps {
  streamData: EnvielStreamingData;
  episodes?: EnvielEpisode[];
  animeSlug?: string;
  source?: string;
  currentEpisodeSlug?: string;
}

export function WatchView({ streamData, episodes, animeSlug, source = "Stream1", currentEpisodeSlug }: WatchViewProps) {
  return (
    <div className="min-h-screen bg-[#050505] pt-24 pb-10 px-4 md:px-8">
       <div className="max-w-7xl mx-auto space-y-6">
          <Button 
            as={Link} 
            href={animeSlug ? `/anime/${animeSlug}` : "/"} 
            variant="light" 
            className="text-neutral-400 hover:text-white pl-0 gap-2"
          >
            <ArrowLeft size={18} /> {animeSlug ? "Back to Details" : "Back to Home"}
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
             <div className="lg:col-span-9 space-y-4">
               <EnvielPlayer data={streamData} />
               {streamData.title && (
                 <h1 className="text-xl md:text-2xl font-bold text-white mt-4">{streamData.title}</h1>
               )}
             </div>
             
             <div className="lg:col-span-3">
               {episodes && episodes.length > 0 ? (
                 <EnvielEpisodeList 
                    episodes={episodes}
                    currentEpisodeSlug={currentEpisodeSlug || ""}
                    source={source}
                    animeSlug={animeSlug}
                 />
               ) : (
                 <div className="bg-neutral-900/50 border border-white/5 rounded-xl p-6 text-center text-neutral-500">
                    <p>More episodes available on the Details page.</p>
                 </div>
               )}
             </div>
          </div>
       </div>
    </div>
  );
}
