import Link from "next/link";
import { redirect } from "next/navigation";
import { Atom, BarChart3, BriefcaseBusiness, ChevronRight, GraduationCap } from "lucide-react";
import ProfileAvatar from "@/components/ProfileAvatar";
import Aurora from "@/components/auth/Aurora";
import { getOrCreateCurrentProfile } from "@/lib/profileStore";
import {
  getProfileDisplayName,
  getProfileInitial,
  getProfileSubtitle,
} from "@/lib/profile";
import { hasUserChosenName } from "@/lib/userProfile";

export const dynamic = "force-dynamic";

const DASHBOARD_AURORA_COLORS: [string, string, string] = ["#7cff67", "#B497CF", "#5227FF"];

export default async function Dashboard() {
  const { user, profile } = await getOrCreateCurrentProfile();

  if (!user || !profile) {
    redirect("/sign-in");
  }

  if (!hasUserChosenName(user)) {
    redirect("/onboarding");
  }

  const greetingName = getProfileDisplayName(profile);
  const profileInitial = getProfileInitial(greetingName);
  const subtitle = getProfileSubtitle(profile);
  const featureCards = [
    {
      title: "Experiment Zone",
      description: "Explore hands-on ideas, creative trials, and guided discovery sessions.",
      icon: Atom,
      accent: "from-[#7cff67]/20 via-[#7cff67]/5 to-transparent",
      eyebrow: "Discovery Lab",
      href: "/experiment-zone",
    },
    {
      title: "Career Guidance",
      description: "Shape next steps with mentorship prompts, pathways, and future-ready planning.",
      icon: BriefcaseBusiness,
      accent: "from-[#b497cf]/25 via-[#b497cf]/8 to-transparent",
      eyebrow: "Future Path",
      href: "/career-guidance",
    },
    {
      title: "Classroom",
      description: "Keep lessons, collaboration, and learning rituals organized in one place.",
      icon: GraduationCap,
      accent: "from-[#78d7ff]/25 via-[#78d7ff]/8 to-transparent",
      eyebrow: "Learning Hub",
      href: "/classroom",
    },
    {
      title: "Stats",
      description: "Track engagement, outcomes, and progress signals across your workspace.",
      icon: BarChart3,
      accent: "from-[#5227ff]/25 via-[#5227ff]/8 to-transparent",
      eyebrow: "Insight Pulse",
      href: "/stats",
    },
  ];

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050505] px-4 py-8 text-white selection:bg-brand-teal/30 selection:text-brand-teal dark md:px-8">
      <div className="pointer-events-none absolute inset-0 z-0 opacity-80">
        <Aurora
          colorStops={DASHBOARD_AURORA_COLORS}
          blend={0.5}
          amplitude={1}
          speed={0.45}
        />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-8">
        <nav className="auth-panel rounded-[2rem] px-5 py-4 md:px-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-brand-lavender/70">
                Nexus Dashboard
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-brand-ice md:text-4xl">
                Welcome, {greetingName}
              </h1>
              {subtitle ? (
                <p className="mt-2 max-w-2xl text-sm text-on-surface-variant">
                  {subtitle}
                </p>
              ) : null}
            </div>

            <Link
              href="/profile"
              className="auth-oauth-button w-full justify-between rounded-2xl px-3 py-3 md:w-auto md:min-w-[220px]"
            >
              <span className="flex items-center gap-3">
                <ProfileAvatar
                  avatarUrl={profile.avatar_url}
                  alt={`${greetingName} avatar`}
                  fallback={profileInitial}
                  seed={profile.id}
                  sizeClassName="h-11 w-11"
                  textClassName="text-sm font-semibold"
                />
                <span className="text-left">
                  <span className="block text-sm font-semibold text-white">
                    View Profile
                  </span>
                  <span className="block text-xs text-on-surface-variant">
                    Manage account details
                  </span>
                </span>
              </span>
              <ChevronRight className="h-4 w-4 text-brand-lavender" />
            </Link>
          </div>
        </nav>

        <section className="auth-panel rounded-[2rem] p-5 md:p-6">
          <div className="mb-6 flex flex-col gap-2">
            <p className="text-xs uppercase tracking-[0.35em] text-brand-teal/70">
              Main Workspace
            </p>
            <h2 className="text-2xl font-semibold tracking-tight text-white">
              Your four core zones
            </h2>
            <p className="max-w-3xl text-sm text-on-surface-variant">
              The dashboard now centers around the same cinematic feel as the sign-in
              and sign-up experience, while keeping your existing workflow options below.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {featureCards.map(({ title, description, icon: Icon, accent, eyebrow, href }) => (
              <Link
                key={title}
                href={href}
                className="auth-card auth-card-enter group relative overflow-hidden rounded-[1.75rem] p-6 transition duration-300 hover:-translate-y-1 hover:border-brand-lavender/30 hover:shadow-[0_24px_60px_rgba(5,5,8,0.5)]"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${accent} opacity-100`} />
                <div className="relative z-10 flex h-full flex-col">
                  <div className="mb-5 flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.35em] text-on-surface-variant/80">
                        {eyebrow}
                      </p>
                      <h3 className="mt-3 text-2xl font-semibold tracking-tight text-white">
                        {title}
                      </h3>
                    </div>
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-black/20 text-brand-lavender shadow-[0_0_24px_rgba(180,151,207,0.18)]">
                      <Icon className="h-6 w-6" />
                    </span>
                  </div>

                  <p className="mb-6 text-sm leading-6 text-on-surface-variant">
                    {description}
                  </p>

                  <div className="mt-auto flex items-center justify-between rounded-2xl border border-white/5 bg-black/20 px-4 py-3">
                    <span className="text-sm font-medium text-brand-ice">
                      Open section
                    </span>
                    <ChevronRight className="h-4 w-4 text-brand-teal/80 transition-transform duration-300 group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
