"use client";

import { Card, CardFooter, Image } from "@heroui/react";
import Link from "next/link";
import { EnvielAnimeListItem } from "@/lib/enviel-types";
import { CardSpotlight } from "../aceternity/card-spotlight";

interface EnvielCardProps {
  anime: EnvielAnimeListItem;
}

export function EnvielCard({ anime }: EnvielCardProps) {
  return (
    <Link href={`/anime/${anime.slug}`}>
      <div className="group relative h-[320px] w-[220px]">
        {/* Aceternity Spotlight Wrapper */}
        <CardSpotlight className="h-full w-full p-0 border-0 bg-transparent" color="#0AC09A">
          <Card
            isFooterBlurred
            radius="lg"
            className="h-full w-full border-none bg-transparent"
          >
            <Image
              alt={anime.title}
              className="object-cover h-full w-full group-hover:scale-110 transition-transform duration-500"
              src={anime.poster}
              height={320}
              width={220}
            />
            <CardFooter className="justify-between before:bg-white/10 border-white/20 border-1 overflow-hidden py-2 absolute before:rounded-xl rounded-large bottom-1 w-[calc(100%_-_8px)] shadow-small ml-1 z-10">
              <div className="flex flex-col flex-1 truncate px-1">
                 <p className="text-tiny text-white/80 font-bold truncate">{anime.title}</p>
                 <p className="text-tiny text-enviel-300">
                   {anime.episode || "TV Series"}
                 </p>
              </div>
            </CardFooter>
          </Card>
        </CardSpotlight>
      </div>
    </Link>
  );
}
