"use client";

import { Skeleton } from "@heroui/react";

export function EnvielSkeletonRow() {
  return (
    <div className="w-full py-8 px-6 md:px-12 space-y-4">
      <Skeleton className="w-48 h-8 rounded-lg bg-white/5" />
      <div className="flex gap-4 overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex flex-col gap-2 shrink-0">
             <Skeleton className="h-[320px] w-[220px] rounded-xl bg-white/5" />
             <div className="space-y-2 px-1">
               <Skeleton className="w-3/4 h-3 rounded-lg bg-white/5" />
               <Skeleton className="w-1/2 h-3 rounded-lg bg-white/5" />
             </div>
          </div>
        ))}
      </div>
    </div>
  );
}
