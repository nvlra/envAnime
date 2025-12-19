"use client";

import { Button } from "@heroui/react";
import { Play, Info } from "lucide-react";
import { Spotlight } from "../aceternity/spotlight";
import { TextGenerateEffect } from "../aceternity/text-generate-effect";
import { EnvielAnimeListItem } from "@/lib/enviel-types";

interface EnvielHeroProps {
  featured: EnvielAnimeListItem;
}

export function EnvielHero({ featured }: EnvielHeroProps) {
  if (!featured) return null;

  return (
    <div className="relative h-[80vh] w-full overflow-hidden flex items-center justify-center bg-black/[0.96] antialiased bg-grid-white/[0.02]">
      <Spotlight
        className="-top-40 left-0 md:left-60 md:-top-20"
        fill="white"
      />
      
      {/* Background Image with Gradient Mask */}
      <div 
        className="absolute inset-0 z-0 opacity-50 bg-cover bg-center"
        style={{ backgroundImage: `url(${featured.poster})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-[#050505]/40 to-transparent" />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-start justify-center h-full pt-20">
        <div className="max-w-2xl">
           <h2 className="text-enviel-400 font-bold tracking-widest text-sm mb-2 uppercase">
             Trending Now #1
           </h2>
           <h1 className="text-4xl md:text-7xl font-bold text-white mb-4">
             {featured.title}
           </h1>
           
           <div className="mb-6">
             <TextGenerateEffect 
                words={featured.episode || "Latest Episode Streaming Now"} 
                className="text-lg text-neutral-300" 
             />
           </div>

           <div className="flex gap-4 mt-8">
             <Button 
               size="lg" 
               className="bg-white text-black font-bold px-8"
               startContent={<Play fill="currentColor" />}
             >
               Play
             </Button>
             <Button 
               size="lg" 
               variant="bordered"
               className="text-white border-white/30 backdrop-blur-md enviel-glass"
               startContent={<Info />}
             >
               More Info
             </Button>
           </div>
        </div>
      </div>
    </div>
  );
}
