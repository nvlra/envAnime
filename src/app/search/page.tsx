"use client";

import { envielSearchAnime } from "@/lib/enviel-api";
import { FocusCards } from "@/components/aceternity/focus-cards";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { EnvielSearchResult } from "@/lib/enviel-types";
import { Spinner } from "@heroui/react";

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q");
  const [results, setResults] = useState<EnvielSearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchResults() {
      if (query) {
        setLoading(true);
        const data = await envielSearchAnime(query);
        setResults(data);
        setLoading(false);
      }
    }
    fetchResults();
  }, [query]);

  return (
    <div className="min-h-screen pt-24 px-4 md:px-8 pb-20">
      <div className="max-w-7xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-white">
          Search Results for <span className="text-enviel-500">&apos;{query}&apos;</span>
        </h1>

        {loading ? (
          <div className="flex h-60 items-center justify-center">
            <Spinner size="lg" color="success" />
          </div>
        ) : results.length > 0 ? (
          <FocusCards cards={results} />
        ) : (
          <div className="text-neutral-400 text-center py-20">
            No results found. Try another keyword.
          </div>
        )}
      </div>
    </div>
  );
}
