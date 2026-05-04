import { redirect } from "next/navigation";

import Aurora from "@/components/auth/Aurora";
import ClassroomWorkspace from "@/components/classroom/ClassroomWorkspace";
import { getOrCreateCurrentProfile } from "@/lib/profileStore";
import { getProfileDisplayName } from "@/lib/profile";

export const dynamic = "force-dynamic";

const CLASSROOM_AURORA_COLORS: [string, string, string] = ["#7cff67", "#B497CF", "#5227FF"];

export default async function ClassroomPage() {
  const { user, profile } = await getOrCreateCurrentProfile();

  if (!user || !profile) {
    redirect("/sign-in");
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050505] px-4 py-8 text-white selection:bg-brand-teal/30 selection:text-brand-teal dark md:px-8">
      <div className="pointer-events-none absolute inset-0 z-0 opacity-80">
        <Aurora
          colorStops={CLASSROOM_AURORA_COLORS}
          blend={0.5}
          amplitude={1}
          speed={0.45}
        />
      </div>

      <ClassroomWorkspace
        displayName={getProfileDisplayName(profile)}
        role={profile.role}
      />
    </main>
  );
}
