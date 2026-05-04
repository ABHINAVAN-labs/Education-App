import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { redirect } from "next/navigation";
import Aurora from "@/components/auth/Aurora";
import DeleteAccountButton from "@/app/profile/DeleteAccountButton";
import ProfileAvatarEditor from "@/app/profile/ProfileAvatarEditor";
import ProfileDetailsEditor from "@/app/profile/ProfileDetailsEditor";
import { getOrCreateCurrentProfile } from "@/lib/profileStore";
import {
  getProfileDisplayName,
  getProfileInitial,
  getProfileSubtitle,
} from "@/lib/profile";

export const dynamic = "force-dynamic";

const PROFILE_AURORA_COLORS: [string, string, string] = ["#7cff67", "#B497CF", "#5227FF"];

export default async function ProfilePage() {
  const { user, profile } = await getOrCreateCurrentProfile();

  if (!user || !profile) {
    redirect("/sign-in");
  }

  const displayName = getProfileDisplayName(profile);
  const initial = getProfileInitial(displayName);
  const subtitle = getProfileSubtitle(profile);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050505] px-4 py-8 text-white selection:bg-brand-teal/30 selection:text-brand-teal dark md:px-8">
      <div className="pointer-events-none absolute inset-0 z-0 opacity-80">
        <Aurora
          colorStops={PROFILE_AURORA_COLORS}
          blend={0.5}
          amplitude={1}
          speed={0.45}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl space-y-6">
        <div className="flex justify-start">
          <Link
            href="/dashboard"
            className="auth-oauth-button inline-flex h-11 w-11 items-center justify-center rounded-full"
            aria-label="Go back to dashboard"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </div>

        <section className="auth-panel rounded-[2rem] p-6 md:p-7">
          <p className="text-xs uppercase tracking-[0.35em] text-brand-lavender/70">
            User Profile
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-brand-ice">
            {displayName}
          </h1>
          {subtitle ? (
            <p className="mt-3 max-w-2xl text-sm text-on-surface-variant">
              {subtitle}
            </p>
          ) : null}
        </section>

        <section className="auth-card rounded-[1.75rem] p-6">
          <ProfileAvatarEditor
            userId={profile.id}
            displayName={displayName}
            initial={initial}
            avatarUrl={profile.avatar_url}
          />
        </section>

        <section className="auth-panel rounded-[2rem] p-6">
          <h2 className="text-2xl font-semibold tracking-tight text-white">
            Account details
          </h2>
          <dl className="mt-6 grid gap-4 md:grid-cols-2">
            <ProfileDetailsEditor
              userId={profile.id}
              initialDisplayName={profile.display_name}
              initialBio={profile.bio}
            />
            <div className="auth-card rounded-[1.25rem] p-5">
              <dt className="text-xs uppercase tracking-[0.3em] text-on-surface-variant/75">
                Email
              </dt>
              <dd className="mt-3 text-lg text-white">{profile.email}</dd>
            </div>
            <div className="auth-card rounded-[1.25rem] p-5">
              <dt className="text-xs uppercase tracking-[0.3em] text-on-surface-variant/75">
                User ID
              </dt>
              <dd className="mt-3 break-all text-sm text-on-surface-variant">
                {profile.id}
              </dd>
            </div>
            <div className="auth-card rounded-[1.25rem] p-5">
              <dt className="text-xs uppercase tracking-[0.3em] text-on-surface-variant/75">
                Joined
              </dt>
              <dd className="mt-3 text-lg text-white">
                {new Date(profile.created_at).toLocaleDateString()}
              </dd>
            </div>
          </dl>
        </section>

        <div className="grid gap-6 md:grid-cols-2">
          <section className="auth-card rounded-[1.75rem] border border-red-500/20 p-6">
            <h2 className="text-2xl font-semibold tracking-tight text-red-300">
              Danger zone
            </h2>
            <p className="mt-3 text-sm text-on-surface-variant">
              Deleting your account permanently removes your profile and deletes
              your Supabase auth user. This action cannot be undone.
            </p>
            <div className="mt-6">
              <DeleteAccountButton />
            </div>
          </section>

          <section className="auth-card rounded-[1.75rem] p-6">
            <h2 className="text-2xl font-semibold tracking-tight text-white">
              Session
            </h2>
            <p className="mt-3 text-sm text-on-surface-variant">
              Sign out of your current account on this device.
            </p>
            <div className="mt-6">
              <form action="/sign-out" method="post">
                <button
                  type="submit"
                  className="auth-oauth-button rounded-xl px-5 py-3"
                >
                  Sign Out
                </button>
              </form>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
