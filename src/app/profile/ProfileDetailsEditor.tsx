"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

type ProfileDetailsEditorProps = {
  userId: string;
  initialDisplayName: string | null;
  initialBio: string | null;
};

export default function ProfileDetailsEditor({
  userId,
  initialDisplayName,
  initialBio,
}: ProfileDetailsEditorProps) {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [displayName, setDisplayName] = useState(initialDisplayName ?? "");
  const [bio, setBio] = useState(initialBio ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedDisplayName = displayName.trim();
    const trimmedBio = bio.trim();

    if (!trimmedDisplayName) {
      setError("Display name cannot be empty.");
      setSuccess(null);
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    const { error: authError } = await supabase.auth.updateUser({
      data: {
        display_name: trimmedDisplayName,
      },
    });

    if (authError) {
      setError(authError.message);
      setSaving(false);
      return;
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        display_name: trimmedDisplayName,
        bio: trimmedBio || null,
      })
      .eq("id", userId);

    if (profileError) {
      setError(profileError.message);
      setSaving(false);
      return;
    }

    setSuccess("Profile updated.");
    setSaving(false);
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="auth-card space-y-4 rounded-[1.25rem] p-5 md:col-span-2">
      <div>
        <label
          htmlFor="display-name"
          className="mb-2 block text-xs uppercase tracking-[0.25em] text-on-surface-variant/75"
        >
          Display name
        </label>
        <input
          id="display-name"
          type="text"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          maxLength={40}
          required
          className="neu-inset w-full rounded-xl border border-white/5 bg-surface-container-lowest px-4 py-3 text-white placeholder:text-on-surface-variant/30 focus:outline-none focus:ring-1 focus:ring-brand-teal"
        />
      </div>

      <div>
        <label
          htmlFor="bio"
          className="mb-2 block text-xs uppercase tracking-[0.25em] text-on-surface-variant/75"
        >
          Bio
        </label>
        <textarea
          id="bio"
          value={bio}
          onChange={(event) => setBio(event.target.value)}
          maxLength={255}
          rows={3}
          placeholder="Add a short bio"
          className="neu-inset w-full rounded-xl border border-white/5 bg-surface-container-lowest px-4 py-3 text-white placeholder:text-on-surface-variant/30 focus:outline-none focus:ring-1 focus:ring-brand-teal"
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="auth-primary-button rounded-xl px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-70"
        >
          {saving ? "Saving..." : "Save changes"}
        </button>
        {error ? <p className="text-sm text-red-300">{error}</p> : null}
        {success ? <p className="text-sm text-emerald-300">{success}</p> : null}
      </div>
    </form>
  );
}
