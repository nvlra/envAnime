"use client";

import { EnvielStreamingData } from "@/lib/enviel-types";
import { Tabs, Tab } from "@heroui/react";
import { useState } from "react";

interface EnvielPlayerProps {
  data: EnvielStreamingData;
}

export function EnvielPlayer({ data }: EnvielPlayerProps) {
  // Combine primary embed and alternatives
  const servers = [];
  if (data.embed) servers.push(data.embed);
  if (data.alternatives) servers.push(...data.alternatives);

  const [currentServer, setCurrentServer] = useState(servers[0]?.embed_url);

  if (!servers.length) {
    return (
      <div className="aspect-video w-full bg-black border border-white/10 rounded-xl flex items-center justify-center text-neutral-500">
        No stream available
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Player Frame */}
      <div className="relative aspect-video w-full bg-black rounded-xl overflow-hidden border border-white/10 shadow-2xl shadow-enviel-500/5">
         <iframe
           src={currentServer}
           className="w-full h-full border-0"
           allowFullScreen
           allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
         />
      </div>

      {/* Server Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-neutral-900/50 p-4 rounded-xl border border-white/5">
         <div className="text-sm font-medium text-neutral-400">
           Playing: <span className="text-white">{data.title}</span>
         </div>
         
         <Tabs 
           aria-label="Server options" 
           size="sm" 
           color="success" 
           variant="bordered"
           classNames={{
             tabList: "bg-transparent border-white/10",
             cursor: "bg-enviel-500",
             tabContent: "group-data-[selected=true]:text-white"
           }}
           selectedKey={currentServer}
           onSelectionChange={(key) => setCurrentServer(key as string)}
         >
            {servers.map((server, idx) => (
              <Tab key={server.embed_url} title={`${server.server} ${server.quality ? `(${server.quality})` : ''}`} />
            ))}
         </Tabs>
      </div>
    </div>
  );
}
