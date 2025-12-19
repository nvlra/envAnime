"use client";

import { Button } from "@heroui/react";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4 text-center px-4">
      <h2 className="text-2xl font-bold">Something went wrong!</h2>
      <p className="text-neutral-400 max-w-md">
        We couldn&apos;t load the anime data. Please check your connection or try again.
      </p>
      <Button 
        onPress={reset} 
        className="bg-enviel-500 text-white font-medium"
      >
        Try again
      </Button>
    </div>
  );
}
