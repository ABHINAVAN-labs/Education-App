import Link from "next/link";
import { ArrowLeft, Compass, Goal, MapPinned, Sparkles } from "lucide-react";
import { redirect } from "next/navigation";

import Aurora from "@/components/auth/Aurora";
import { getOrCreateCurrentProfile } from "@/lib/profileStore";

export const dynamic = "force-dynamic";

const CAREER_AURORA_COLORS: [string, string, string] = ["#7cff67", "#B497CF", "#5227FF"];

const guidancePanels = [
  {
    title: "Career Paths",
    description: "Save possible directions and compare next-step options once the guidance system is connected.",
    icon: Compass,
  },
  {
    title: "Milestone Planning",
    description: "Outline goals, deadlines, and academic checkpoints in a structure-ready layout.",
    icon: Goal,
  },
  {
    title: "Opportunity Map",
    description: "Reserve space for future mentorship links, recommendations, and curated resources.",
    icon: MapPinned,
  },
];

export default async function CareerGuidancePage() {
  const { user, profile } = await getOrCreateCurrentProfile();

  if (!user || !profile) {
    redirect("/sign-in");
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050505] px-4 py-8 text-white selection:bg-brand-teal/30 selection:text-brand-teal dark md:px-8">
      <div className="pointer-events-none absolute inset-0 z-0 opacity-80">
        <Aurora colorStops={CAREER_AURORA_COLORS} blend={0.5} amplitude={1} speed={0.45} />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl space-y-6">
        <div className="flex justify-start">
          <Link href="/dashboard" className="auth-oauth-button inline-flex h-11 w-11 items-center justify-center rounded-full" aria-label="Go back to dashboard">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </div>

        <section className="auth-panel rounded-[2rem] p-6 md:p-7">
          <p className="text-xs uppercase tracking-[0.35em] text-brand-lavender/70">Career Guidance</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-brand-ice">Guidance shell ready</h1>
          <p className="mt-3 max-w-3xl text-sm text-on-surface-variant">
            This section is prepared as a polished frontend surface only, just as you requested.
            Nothing was changed in the backend for career guidance.
          </p>
        </section>

        <div className="grid gap-5 md:grid-cols-3">
          {guidancePanels.map(({ title, description, icon: Icon }) => (
            <section key={title} className="auth-card rounded-[1.75rem] p-6">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-black/20 text-brand-lavender">
                <Icon className="h-6 w-6" />
              </span>
              <h2 className="mt-5 text-2xl font-semibold text-white">{title}</h2>
              <p className="mt-3 text-sm text-on-surface-variant">{description}</p>
            </section>
          ))}
        </div>

        <section className="auth-card rounded-[1.75rem] p-6">
          <div className="flex items-start gap-4">
            <Sparkles className="mt-1 h-6 w-6 text-brand-teal" />
            <div>
              <h2 className="text-2xl font-semibold text-white">Frontend only for now</h2>
              <p className="mt-3 text-sm text-on-surface-variant">
                The visual layout is in place so you can keep building the experience later without rewriting this page.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
