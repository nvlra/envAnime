"use client";

import { EnvielEpisode } from "@/lib/enviel-types";
import { ScrollShadow } from "@heroui/react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { PlayCircle } from "lucide-react";

interface EnvielEpisodeListProps {
  episodes: EnvielEpisode[];
  currentEpisodeSlug?: string;
  source: string;
  animeSlug?: string;
}

export function EnvielEpisodeList({ episodes, currentEpisodeSlug, source, animeSlug }: EnvielEpisodeListProps) {
  return (
    <div className="bg-neutral-900/50 border border-white/5 rounded-xl overflow-hidden flex flex-col h-full max-h-[600px]">
      <div className="p-4 border-b border-white/5 bg-neutral-900/80">
        <h3 className="font-semibold text-lg text-white">Episodes ({episodes.length})</h3>
      </div>
      
      <ScrollShadow className="flex-1 w-full p-2">
        <div className="flex flex-col gap-1">
          {episodes.map((ep) => {
             const isActive = ep.slug === currentEpisodeSlug;
             return (
               <Link
                 key={ep.slug}
                 href={`/watch/${source}/${ep.slug}${animeSlug ? `?anime=${animeSlug}` : ''}`}
                 className={cn(
                   "flex items-center gap-3 p-3 rounded-lg transition-all group",
                   isActive 
                     ? "bg-enviel-500/10 border border-enviel-500/20" 
                     : "hover:bg-white/5 border border-transparent"
                 )}
               >
                 <div className={cn(
                   "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors",
                   isActive ? "bg-enviel-500 text-white" : "bg-white/10 text-neutral-400 group-hover:bg-white/20"
                 )}>
                   {ep.number}
                 </div>
                 
                 <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-sm font-medium truncate",
                      isActive ? "text-enviel-400" : "text-neutral-300 group-hover:text-white"
                    )}>
                      {ep.title}
                    </p>
                 </div>
                 
                 {isActive && <PlayCircle size={16} className="text-enviel-500" />}
               </Link>
             );
          })}
        </div>
      </ScrollShadow>
    </div>
  );
}
