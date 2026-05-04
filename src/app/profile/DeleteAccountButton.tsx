"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeleteAccountButton() {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    const confirmed = window.confirm(
      "Delete your account permanently? This will remove your profile and your Supabase account."
    );

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    setError(null);

    const response = await fetch("/api/account", {
      method: "DELETE",
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      setError(data?.error ?? "Failed to delete account.");
      setIsDeleting(false);
      return;
    }

    router.replace("/sign-in");
    router.refresh();
  };

  return (
    <div className="space-y-3">
      {error ? (
        <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      ) : null}

      <button
        type="button"
        onClick={handleDelete}
        disabled={isDeleting}
        className="rounded-xl border border-red-400/30 bg-red-500/15 px-4 py-3 font-medium text-red-100 transition-colors hover:bg-red-500/25 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isDeleting ? "Deleting account..." : "Delete account"}
      </button>
    </div>
  );
}
