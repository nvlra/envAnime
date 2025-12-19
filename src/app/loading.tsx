"use client";

import { EnvielSkeletonRow } from "@/components/ui/EnvielSkeleton";
import { Skeleton } from "@heroui/react";

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#050505] text-white pb-20">
      {/* Hero Skeleton */}
      <div className="w-full h-[70vh] bg-neutral-900/50 relative overflow-hidden">
         <div className="max-w-7xl mx-auto h-full flex flex-col justify-center px-8">
            <Skeleton className="w-32 h-4 rounded-lg mb-4 bg-white/5" />
            <Skeleton className="w-full md:w-1/2 h-16 rounded-xl mb-6 bg-white/5" />
            <Skeleton className="w-full md:w-1/3 h-6 rounded-lg mb-8 bg-white/5" />
            <div className="flex gap-4">
              <Skeleton className="w-32 h-12 rounded-xl bg-white/5" />
              <Skeleton className="w-32 h-12 rounded-xl bg-white/5" />
            </div>
         </div>
      </div>
      
      {/* Rows Skeleton */}
      <div className="-mt-20 relative z-20 space-y-8">
        <EnvielSkeletonRow />
        <EnvielSkeletonRow />
      </div>
    </div>
  );
}
