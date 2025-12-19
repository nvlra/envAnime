"use client";

import { Input } from "@heroui/react";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function EnvielSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <form onSubmit={handleSearch} className="w-full max-w-sm">
      <Input
        classNames={{
          base: "max-w-full sm:max-w-[15rem] h-10",
          mainWrapper: "h-full",
          input: "text-small",
          inputWrapper:
            "h-full font-normal text-default-500 bg-default-400/20 dark:bg-default-500/20",
        }}
        placeholder="Search anime..."
        size="sm"
        startContent={<Search size={18} className="text-enviel-300" />}
        type="search"
        value={query}
        onValueChange={setQuery}
        radius="full"
      />
    </form>
  );
}
