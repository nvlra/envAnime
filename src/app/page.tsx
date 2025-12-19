import { envielFetchOngoing, envielFetchComplete } from "@/lib/enviel-api";
import { EnvielHero } from "@/components/ui/EnvielHero";
import { EnvielRow } from "@/components/ui/EnvielRow";
import { InfiniteMovingCards } from "@/components/aceternity/infinite-moving-cards";

// Server Component
export default async function Home() {
  const ongoing = await envielFetchOngoing(1);
  const complete = await envielFetchComplete(1);

  // Strategy for featured content
  const featured = ongoing.length > 0 ? ongoing[0] : null;
  const trending = ongoing.slice(0, 10).map(item => ({
     title: item.title,
     image: item.poster
  }));

  return (
    <div className="min-h-screen bg-[#050505] text-white overflow-x-hidden pb-20 md:pb-0">
      
      {/* Background Ambience - Optional, kept simple for performance or use Aceternity */}
      {/* <div className="fixed inset-0 z-0 pointer-events-none opacity-20">
         <BackgroundGradientAnimation containerClassName="h-full w-full" />
      </div> */}
      
      <main className="relative z-10 flex flex-col gap-8">
        {/* Featured Hero */}
        {featured && <EnvielHero featured={featured} />}
        
        {/* Trending Marquee */}
        <div className="py-4">
           {trending.length > 0 && <InfiniteMovingCards items={trending} direction="left" speed="slow" />}
        </div>
 
        {/* Content Rows */}
        <div className="space-y-4 -mt-10 md:-mt-20 relative z-20 pb-10">
           <EnvielRow 
             id="ongoing"
             title="Ongoing Anime" 
             items={ongoing} 
             viewAllLink="/ongoing"
           />
           
           <EnvielRow 
             id="complete"
             title="Recently Completed" 
             items={complete} 
             viewAllLink="/complete"
           />
        </div>
      </main>
    </div>
  );
}
