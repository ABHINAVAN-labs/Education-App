"use client";

import { useEffect, useState } from "react";
import {
  BarChart3,
  BookOpenText,
  BriefcaseBusiness,
  CalendarDays,
  ClipboardCheck,
  FileText,
  GraduationCap,
  LoaderCircle,
  Sparkles,
} from "lucide-react";

import { getClassroomStats, type ClassroomRole, type ClassroomStats } from "@/lib/classroomApi";
import WorkspaceShell from "@/components/workspace/WorkspaceShell";

type StatsWorkspaceProps = {
  displayName: string;
  role: ClassroomRole;
};

const iconByLabel = {
  "Classes Taken": CalendarDays,
  "Assignments Created": ClipboardCheck,
  "Notes Uploaded": FileText,
  "Classes Attended": CalendarDays,
  "Assignments Submitted": ClipboardCheck,
} as const;

export default function StatsWorkspace({
  displayName,
  role: initialRole,
}: StatsWorkspaceProps) {
  const [stats, setStats] = useState<ClassroomStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const navItems = [
    { href: "/experiment-zone", label: "Experiment Zone", icon: Sparkles },
    { href: "/career-guidance", label: "Career Guidance", icon: BriefcaseBusiness },
    { href: "/classroom", label: "Classroom", icon: GraduationCap },
    { href: "/stats", label: "Stats", icon: BarChart3, active: true },
  ];

  const isTeacher = initialRole === "teacher" || initialRole === "admin";
  const roleLabel = isTeacher ? "Teacher Workspace" : "Student Workspace";

  useEffect(() => {
    let cancelled = false;

    const loadStats = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await getClassroomStats();

        if (!cancelled) {
          setStats(result);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error ? loadError.message : "Failed to load stats."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadStats();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <WorkspaceShell
      eyebrow="Stats"
      title={isTeacher ? "Teacher performance overview" : "Student progress overview"}
      description="Role-based classroom metrics sourced from the new backend stats endpoint, while preserving the existing Lumina dark-glass presentation."
      roleLabel={roleLabel}
      displayName={displayName}
      navItems={navItems}
    >
      {loading ? (
        <div className="auth-panel flex min-h-[320px] items-center justify-center rounded-[2rem] p-8">
          <div className="flex items-center gap-3 text-on-surface-variant">
            <LoaderCircle className="h-5 w-5 animate-spin" />
            <span>Loading stats...</span>
          </div>
        </div>
      ) : null}

      {!loading && error ? (
        <div className="rounded-[1.5rem] border border-red-400/35 bg-red-500/10 px-5 py-4 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      {!loading && !error && stats ? (
        <div className="space-y-6">
          <div className={`grid gap-5 ${stats.cards.length >= 3 ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
            {stats.cards.map((card) => {
              const Icon = iconByLabel[card.label as keyof typeof iconByLabel] ?? BookOpenText;

              return (
                <section key={card.label} className="auth-card rounded-[1.75rem] p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.35em] text-on-surface-variant/75">
                        {card.label}
                      </p>
                      <p className="mt-4 text-5xl font-bold tracking-tight text-white">
                        {card.value}
                      </p>
                    </div>
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-black/20 text-brand-lavender">
                      <Icon className="h-6 w-6" />
                    </span>
                  </div>
                  <p className="mt-5 text-sm text-on-surface-variant">{card.detail}</p>
                </section>
              );
            })}
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <section className="auth-panel rounded-[2rem] p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-brand-teal/70">
                    Role Lens
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">
                    {isTeacher ? "Teacher-facing metrics" : "Student-facing metrics"}
                  </h2>
                </div>
                <BarChart3 className="h-6 w-6 text-brand-teal" />
              </div>
              <div className="mt-5 space-y-3 text-sm text-on-surface-variant">
                {isTeacher ? (
                  <>
                    <p>Classes taken are counted from Lumina meeting sessions you created.</p>
                    <p>Assignments created and notes uploaded come directly from the new classroom backend tables.</p>
                  </>
                ) : (
                  <>
                    <p>Classes attended are counted from meeting participation history.</p>
                    <p>Assignments submitted reflect deadline-aware hand-ins from the classroom system.</p>
                  </>
                )}
              </div>
            </section>

            <section className="auth-card rounded-[1.75rem] p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-brand-lavender/70">
                    Coverage
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">Live role split</h2>
                </div>
                <Sparkles className="h-6 w-6 text-brand-lavender" />
              </div>
              <p className="mt-5 text-sm text-on-surface-variant">
                This page now reads real counts from the backend instead of placeholder cards, while preserving the current Lumina visual language.
              </p>
            </section>
          </div>
        </div>
      ) : null}
    </WorkspaceShell>
  );
}
