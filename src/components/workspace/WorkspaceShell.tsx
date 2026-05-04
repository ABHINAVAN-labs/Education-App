"use client";

import Link from "next/link";
import { ArrowLeft, ChevronRight, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  active?: boolean;
};

type WorkspaceShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  roleLabel: string;
  displayName: string;
  navItems: NavItem[];
  children: React.ReactNode;
};

export default function WorkspaceShell({
  eyebrow,
  title,
  description,
  roleLabel,
  displayName,
  navItems,
  children,
}: WorkspaceShellProps) {
  return (
    <div className="relative z-10 mx-auto flex w-full max-w-7xl items-start gap-6">
      <aside className="auth-panel sticky top-8 hidden w-[280px] self-start rounded-[2rem] p-5 lg:flex lg:flex-col">
        <Link
          href="/dashboard"
          className="auth-oauth-button inline-flex h-11 w-11 items-center justify-center rounded-full"
          aria-label="Go back to dashboard"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>

        <div className="mt-6 rounded-[1.75rem] border border-white/5 bg-black/20 p-5">
          <p className="text-xs uppercase tracking-[0.35em] text-brand-teal/70">
            Workspace
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">
            Lumina
          </h2>
          <p className="mt-2 text-sm text-on-surface-variant">
            Structured classroom tools with role-aware visibility and soft-glow panels.
          </p>
        </div>

        <nav className="mt-6 space-y-3">
          {navItems.map(({ href, label, icon: Icon, active }) => (
            <Link
              key={href}
              href={href}
              className={`group flex items-center justify-between rounded-[1.35rem] border px-4 py-3 transition ${
                active
                  ? "border-brand-lavender/35 bg-white/10 text-white"
                  : "border-white/5 bg-black/20 text-on-surface-variant hover:border-brand-teal/25 hover:text-white"
              }`}
            >
              <span className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-black/20">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="text-sm font-medium">{label}</span>
              </span>
              <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </Link>
          ))}
        </nav>

        <div className="mt-6 rounded-[1.75rem] border border-white/5 bg-black/20 p-5">
          <p className="text-xs uppercase tracking-[0.35em] text-brand-lavender/70">
            Signed in
          </p>
          <p className="mt-3 text-lg font-semibold text-white">{displayName}</p>
          <p className="mt-2 text-sm text-on-surface-variant">{roleLabel}</p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col gap-6">
        <div className="flex justify-start lg:hidden">
          <Link
            href="/dashboard"
            className="auth-oauth-button inline-flex h-11 w-11 items-center justify-center rounded-full"
            aria-label="Go back to dashboard"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </div>

        <section className="auth-panel rounded-[2rem] p-6 md:p-7">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-brand-lavender/70">
                {eyebrow}
              </p>
              <h1 className="mt-3 text-4xl font-bold tracking-tight text-brand-ice">
                {title}
              </h1>
              <p className="mt-3 max-w-3xl text-sm text-on-surface-variant">
                {description}
              </p>
            </div>
            <div className="auth-card flex items-center gap-3 rounded-[1.5rem] px-4 py-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-black/20 text-brand-teal">
                <Sparkles className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-on-surface-variant/70">
                  Active Role
                </p>
                <p className="mt-1 text-sm font-semibold text-white">{roleLabel}</p>
              </div>
            </div>
          </div>
        </section>

        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
