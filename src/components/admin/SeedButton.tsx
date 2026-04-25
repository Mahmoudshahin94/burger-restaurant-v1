"use client";

import { useState } from "react";
import { seedDatabase } from "@/lib/seed";

export default function SeedButton() {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleSeed = async () => {
    if (!confirm("This will populate the database with sample menu data (categories and items). Continue?")) return;
    setLoading(true);
    setError("");
    try {
      await seedDatabase();
      setDone(true);
    } catch (err) {
      setError("Failed to load menu data. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-xl text-sm font-medium">
        ✅ Menu data loaded successfully! Refresh the page.
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={handleSeed}
        disabled={loading}
        className="bg-amber-600 hover:bg-amber-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Loading menu data...
          </span>
        ) : (
          "🌱 Load sample menu data"
        )}
      </button>
      {error && <p className="mt-2 text-red-600 text-sm">{error}</p>}
    </div>
  );
}
