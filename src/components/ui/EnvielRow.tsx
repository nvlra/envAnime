"use client";

import { motion } from "framer-motion";
import { EnvielAnimeListItem } from "@/lib/enviel-types";
import { EnvielCard } from "./EnvielCard";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

interface EnvielRowProps {
  title: string;
  items: EnvielAnimeListItem[];
  id?: string;
  viewAllLink?: string;
}

export function EnvielRow({ title, items, id, viewAllLink }: EnvielRowProps) {
  if (!items || items.length === 0) return null;

  return (
    <section id={id} className="py-8 relative z-20">
      <div className="px-6 md:px-12 mb-4 flex items-center justify-between group">
        <h2 className="text-2xl font-semibold text-white tracking-wide border-l-4 border-enviel-500 pl-3">
          {title}
        </h2>
        
        {viewAllLink && (
           <Link 
             href={viewAllLink}
             className="text-sm text-enviel-300 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
           >
             View All <ChevronRight size={16} />
           </Link>
        )}
      </div>

      <div className="relative">
        <div className="flex gap-4 overflow-x-auto pb-8 pt-4 px-6 md:px-12 no-scrollbar snap-x snap-mandatory">
           {items.map((anime, idx) => (
             <motion.div
               key={anime.slug + idx}
               initial={{ opacity: 0, x: 20 }}
               whileInView={{ opacity: 1, x: 0 }}
               transition={{ delay: idx * 0.05, duration: 0.4 }}
               className="snap-start shrink-0"
             >
               <EnvielCard anime={anime} />
             </motion.div>
           ))}
        </div>
        
        {/* Fade gradients for scroll indication */}
        <div className="absolute top-0 bottom-0 left-0 w-12 bg-gradient-to-r from-[#050505] to-transparent pointer-events-none" />
        <div className="absolute top-0 bottom-0 right-0 w-12 bg-gradient-to-l from-[#050505] to-transparent pointer-events-none" />
      </div>
    </section>
  );
}
