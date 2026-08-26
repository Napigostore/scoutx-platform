"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to observability service
    console.error("Global Error Caught:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-background text-foreground flex min-h-screen items-center justify-center p-4">
        <div className="bg-card w-full max-w-md rounded-2xl border p-8 text-center shadow-xl">
          <h1 className="text-destructive text-5xl font-extrabold">500</h1>
          <h2 className="mt-4 text-lg font-bold">System Error</h2>
          <p className="text-muted-foreground mt-2 text-xs">
            An unexpected error occurred. Our automated observability engine has logged this
            incident.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            className="bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 mt-6 inline-flex items-center justify-center rounded-lg px-4 py-2 text-xs font-semibold transition-colors"
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}
