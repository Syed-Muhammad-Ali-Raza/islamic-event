"use client";

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
    <div className="container-page py-24 text-center">
      <p className="text-5xl mb-4">⚠️</p>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Something went wrong</h1>
      <p className="text-slate-500 text-sm max-w-md mx-auto">
        An unexpected error occurred. Please try again — if the problem persists, come back later.
      </p>
      <button onClick={reset} className="btn-primary mt-6">
        Try Again
      </button>
    </div>
  );
}
