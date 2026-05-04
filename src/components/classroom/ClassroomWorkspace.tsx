"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  BookOpenText,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  Download,
  FileCheck2,
  FileText,
  GraduationCap,
  LoaderCircle,
  Megaphone,
  Plus,
  Sparkles,
  Upload,
  Video,
} from "lucide-react";

import {
  createAnnouncement,
  createAssignment,
  createNote,
  createSubmission,
  downloadNote,
  downloadSubmission,
  fileToUploadPayload,
  getAnnouncements,
  getAssignments,
  getNotes,
  getSubmissions,
  type ClassroomAnnouncement,
  type ClassroomAssignment,
  type ClassroomNote,
  type ClassroomRole,
  type ClassroomSubmission,
} from "@/lib/classroomApi";
import WorkspaceShell from "@/components/workspace/WorkspaceShell";

type ClassroomWorkspaceProps = {
  displayName: string;
  role: ClassroomRole;
};

type ClassroomTab = "notes" | "assignment" | "hand-in" | "announcement" | "meeting";

const tabs: Array<{ id: ClassroomTab; label: string }> = [
  { id: "notes", label: "Notes" },
  { id: "assignment", label: "Assignment" },
  { id: "hand-in", label: "Hand In" },
  { id: "announcement", label: "Announcement" },
  { id: "meeting", label: "Meeting" },
];

const mockMeetings = [
  {
    title: "Weekly Physics Live Session",
    time: "May 5, 2026 • 5:30 PM",
    status: "Open room",
  },
  {
    title: "Career Reflection Circle",
    time: "May 7, 2026 • 4:00 PM",
    status: "Scheduled",
  },
];

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

const formatBytes = (value: number) => {
  if (value < 1024) {
    return `${value} B`;
  }

  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} KB`;
  }

  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
};

const toDatetimeLocalValue = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const localDate = new Date(now.getTime() - offset * 60_000);
  return localDate.toISOString().slice(0, 16);
};

const fetchClassroomData = () =>
  Promise.all([getNotes(), getAssignments(), getSubmissions(), getAnnouncements()]);

export default function ClassroomWorkspace({
  displayName,
  role: initialRole,
}: ClassroomWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<ClassroomTab>("notes");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [role, setRole] = useState<ClassroomRole>(initialRole);
  const [notes, setNotes] = useState<ClassroomNote[]>([]);
  const [assignments, setAssignments] = useState<ClassroomAssignment[]>([]);
  const [submissions, setSubmissions] = useState<ClassroomSubmission[]>([]);
  const [announcements, setAnnouncements] = useState<ClassroomAnnouncement[]>([]);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
    null
  );
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const [noteTitle, setNoteTitle] = useState("");
  const [noteFile, setNoteFile] = useState<File | null>(null);

  const [assignmentTitle, setAssignmentTitle] = useState("");
  const [assignmentDescription, setAssignmentDescription] = useState("");
  const [assignmentDueAt, setAssignmentDueAt] = useState(toDatetimeLocalValue());

  const [submissionAssignmentId, setSubmissionAssignmentId] = useState("");
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);

  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementBody, setAnnouncementBody] = useState("");

  const isTeacher = role === "teacher" || role === "admin";
  const isStudent = role === "student";
  const roleLabel = isTeacher ? "Teacher Workspace" : isStudent ? "Student Workspace" : "Role pending";

  const navItems = [
    { href: "/experiment-zone", label: "Experiment Zone", icon: Sparkles },
    { href: "/career-guidance", label: "Career Guidance", icon: BriefcaseBusiness },
    { href: "/classroom", label: "Classroom", icon: GraduationCap, active: true },
    { href: "/stats", label: "Stats", icon: BarChart3 },
  ];

  async function loadWorkspaceData(nextIsInitial = false) {
    if (nextIsInitial) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      const [notesResponse, assignmentsResponse, submissionsResponse, announcementsResponse] =
        await fetchClassroomData();

      setRole(notesResponse.role ?? initialRole);
      setNotes(notesResponse.notes);
      setAssignments(assignmentsResponse.assignments);
      setSubmissions(submissionsResponse.submissions);
      setAnnouncements(announcementsResponse.announcements);
    } catch (error) {
      setFeedback({
        type: "error",
        message:
          error instanceof Error ? error.message : "Failed to load classroom data.",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    const loadInitialData = async () => {
      setLoading(true);

      try {
        const [notesResponse, assignmentsResponse, submissionsResponse, announcementsResponse] =
          await fetchClassroomData();

        if (cancelled) {
          return;
        }

        setRole(notesResponse.role ?? initialRole);
        setNotes(notesResponse.notes);
        setAssignments(assignmentsResponse.assignments);
        setSubmissions(submissionsResponse.submissions);
        setAnnouncements(announcementsResponse.announcements);
      } catch (error) {
        if (cancelled) {
          return;
        }

        setFeedback({
          type: "error",
          message:
            error instanceof Error ? error.message : "Failed to load classroom data.",
        });
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadInitialData();

    return () => {
      cancelled = true;
    };
  }, [initialRole]);

  async function handleNoteUpload() {
    if (!noteTitle.trim() || !noteFile) {
      setFeedback({ type: "error", message: "Add a note title and choose a file first." });
      return;
    }

    setBusyAction("note-upload");
    setFeedback(null);

    try {
      const file = await fileToUploadPayload(noteFile);
      await createNote({ title: noteTitle.trim(), file });
      setNoteTitle("");
      setNoteFile(null);
      setFeedback({ type: "success", message: "Notes uploaded successfully." });
      await loadWorkspaceData();
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to upload notes.",
      });
    } finally {
      setBusyAction(null);
    }
  }

  async function handleAssignmentCreate() {
    if (!assignmentTitle.trim() || !assignmentDescription.trim() || !assignmentDueAt) {
      setFeedback({ type: "error", message: "Complete all assignment fields before posting." });
      return;
    }

    setBusyAction("assignment-create");
    setFeedback(null);

    try {
      await createAssignment({
        title: assignmentTitle.trim(),
        description: assignmentDescription.trim(),
        dueAt: new Date(assignmentDueAt).toISOString(),
      });
      setAssignmentTitle("");
      setAssignmentDescription("");
      setAssignmentDueAt(toDatetimeLocalValue());
      setFeedback({ type: "success", message: "Assignment created successfully." });
      await loadWorkspaceData();
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to create assignment.",
      });
    } finally {
      setBusyAction(null);
    }
  }

  async function handleSubmissionUpload() {
    if (!submissionAssignmentId || !submissionFile) {
      setFeedback({
        type: "error",
        message: "Choose an assignment and file before uploading your hand-in.",
      });
      return;
    }

    const selectedAssignment = assignments.find(
      (assignment) => assignment.id === submissionAssignmentId
    );

    if (selectedAssignment && new Date() > new Date(selectedAssignment.dueAt)) {
      setFeedback({ type: "error", message: "Submission closed after deadline." });
      return;
    }

    setBusyAction("submission-upload");
    setFeedback(null);

    try {
      const file = await fileToUploadPayload(submissionFile);
      await createSubmission({
        assignmentId: submissionAssignmentId,
        file,
      });
      setSubmissionAssignmentId("");
      setSubmissionFile(null);
      setFeedback({ type: "success", message: "Assignment handed in successfully." });
      await loadWorkspaceData();
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to upload submission.",
      });
    } finally {
      setBusyAction(null);
    }
  }

  async function handleAnnouncementCreate() {
    if (!announcementTitle.trim() || !announcementBody.trim()) {
      setFeedback({
        type: "error",
        message: "Add both a title and message before posting the announcement.",
      });
      return;
    }

    setBusyAction("announcement-create");
    setFeedback(null);

    try {
      await createAnnouncement({
        title: announcementTitle.trim(),
        body: announcementBody.trim(),
      });
      setAnnouncementTitle("");
      setAnnouncementBody("");
      setFeedback({ type: "success", message: "Announcement posted successfully." });
      await loadWorkspaceData();
    } catch (error) {
      setFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to post announcement.",
      });
    } finally {
      setBusyAction(null);
    }
  }

  if (loading) {
    return (
      <WorkspaceShell
        eyebrow="Classroom"
        title="Structured learning environment"
        description="Loading notes, assignments, hand-ins, announcements, and meeting previews."
        roleLabel={roleLabel}
        displayName={displayName}
        navItems={navItems}
      >
        <div className="auth-panel flex min-h-[320px] items-center justify-center rounded-[2rem] p-8">
          <div className="flex items-center gap-3 text-on-surface-variant">
            <LoaderCircle className="h-5 w-5 animate-spin" />
            <span>Loading classroom workspace...</span>
          </div>
        </div>
      </WorkspaceShell>
    );
  }

  return (
    <WorkspaceShell
      eyebrow="Classroom"
      title="Structured learning environment"
      description="Role-based notes, assignments, hand-ins, announcements, and meeting access, all wrapped in the same Lumina dark-glass interface."
      roleLabel={roleLabel}
      displayName={displayName}
      navItems={navItems}
    >
      <div className="space-y-6">
        {feedback ? (
          <div
            className={`rounded-[1.5rem] border px-5 py-4 text-sm ${
              feedback.type === "success"
                ? "border-brand-teal/35 bg-brand-teal/10 text-brand-ice"
                : "border-red-400/35 bg-red-500/10 text-red-200"
            }`}
          >
            {feedback.message}
          </div>
        ) : null}

        <section className="auth-panel rounded-[2rem] p-4">
          <div className="flex flex-wrap gap-3">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                  activeTab === tab.id
                    ? "bg-white/12 text-white shadow-[0_0_22px_rgba(180,151,207,0.18)]"
                    : "bg-black/20 text-on-surface-variant hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => loadWorkspaceData()}
              className="auth-oauth-button ml-auto rounded-2xl px-4 py-3"
              disabled={refreshing}
            >
              {refreshing ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Refreshing
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Refresh data
                </>
              )}
            </button>
          </div>
        </section>

        <div className="grid gap-5 md:grid-cols-3">
          <section className="auth-card rounded-[1.75rem] p-5">
            <p className="text-xs uppercase tracking-[0.35em] text-brand-teal/70">Notes</p>
            <p className="mt-3 text-4xl font-bold text-white">{notes.length}</p>
            <p className="mt-2 text-sm text-on-surface-variant">
              Shared study resources available in this classroom.
            </p>
          </section>
          <section className="auth-card rounded-[1.75rem] p-5">
            <p className="text-xs uppercase tracking-[0.35em] text-brand-lavender/70">
              Assignments
            </p>
            <p className="mt-3 text-4xl font-bold text-white">{assignments.length}</p>
            <p className="mt-2 text-sm text-on-surface-variant">
              Active and upcoming coursework with deadline visibility.
            </p>
          </section>
          <section className="auth-card rounded-[1.75rem] p-5">
            <p className="text-xs uppercase tracking-[0.35em] text-[#78d7ff]/70">Announcements</p>
            <p className="mt-3 text-4xl font-bold text-white">{announcements.length}</p>
            <p className="mt-2 text-sm text-on-surface-variant">
              Classroom updates delivered with role-based control.
            </p>
          </section>
        </div>

        {activeTab === "notes" ? (
          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <section className="auth-panel rounded-[2rem] p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-brand-teal/70">Notes</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">
                    Upload once, access anytime
                  </h2>
                </div>
                <FileText className="h-6 w-6 text-brand-teal" />
              </div>

              <div className="mt-5 space-y-3">
                {notes.length === 0 ? (
                  <div className="rounded-[1.5rem] border border-dashed border-white/10 bg-black/20 p-5 text-sm text-on-surface-variant">
                    No notes uploaded yet.
                  </div>
                ) : null}

                {notes.map((note) => (
                  <div key={note.id} className="auth-card rounded-[1.5rem] p-5">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-white">{note.title}</h3>
                        <p className="mt-2 text-sm text-on-surface-variant">
                          {note.fileName} · {formatBytes(note.fileSizeBytes)}
                        </p>
                        <p className="mt-2 text-sm text-on-surface-variant">
                          Shared by {note.teacher.displayName || note.teacher.email} ·{" "}
                          {formatDateTime(note.createdAt)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => downloadNote(note.id)}
                        className="auth-oauth-button rounded-xl px-4 py-3"
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="auth-card rounded-[2rem] p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-brand-lavender/70">
                    Access
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">
                    {isTeacher ? "Teacher upload panel" : "Student access rules"}
                  </h2>
                </div>
                <Upload className="h-6 w-6 text-brand-lavender" />
              </div>

              {isTeacher ? (
                <div className="mt-5 space-y-4">
                  <input
                    value={noteTitle}
                    onChange={(event) => setNoteTitle(event.target.value)}
                    placeholder="Notes title"
                    className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-on-surface-variant"
                  />
                  <input
                    type="file"
                    onChange={(event) => setNoteFile(event.target.files?.[0] ?? null)}
                    className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-on-surface-variant file:mr-4 file:rounded-xl file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-white"
                  />
                  <button
                    type="button"
                    onClick={handleNoteUpload}
                    disabled={busyAction === "note-upload"}
                    className="auth-primary-button rounded-xl px-5 py-3 text-sm font-semibold"
                  >
                    {busyAction === "note-upload" ? (
                      <>
                        <LoaderCircle className="auth-primary-button-icon h-4 w-4 animate-spin" />
                        Uploading
                      </>
                    ) : (
                      <>
                        <Upload className="auth-primary-button-icon h-4 w-4" />
                        Upload notes
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="mt-5 rounded-[1.5rem] border border-dashed border-white/10 bg-black/20 p-5 text-sm text-on-surface-variant">
                  Students can view and download notes here, but upload controls stay hidden.
                </div>
              )}
            </section>
          </div>
        ) : null}

        {activeTab === "assignment" ? (
          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <section className="auth-panel rounded-[2rem] p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-brand-lavender/70">
                    Assignment
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">
                    Structured coursework feed
                  </h2>
                </div>
                <CalendarClock className="h-6 w-6 text-brand-lavender" />
              </div>

              <div className="mt-5 space-y-3">
                {assignments.length === 0 ? (
                  <div className="rounded-[1.5rem] border border-dashed border-white/10 bg-black/20 p-5 text-sm text-on-surface-variant">
                    No assignments posted yet.
                  </div>
                ) : null}

                {assignments.map((assignment) => {
                  const dueDate = new Date(assignment.dueAt);
                  const closed = new Date() > dueDate;

                  return (
                    <div key={assignment.id} className="auth-card rounded-[1.5rem] p-5">
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-white">{assignment.title}</h3>
                          <p className="mt-2 text-sm text-on-surface-variant">
                            {assignment.description}
                          </p>
                          <p className="mt-3 text-sm text-on-surface-variant">
                            Due {formatDateTime(assignment.dueAt)}
                          </p>
                        </div>
                        <div className="space-y-2 text-right">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs uppercase tracking-[0.25em] ${
                              closed
                                ? "border-red-400/30 text-red-200"
                                : "border-brand-teal/30 text-brand-ice"
                            }`}
                          >
                            {closed ? "Closed" : "Open"}
                          </span>
                          <p className="text-xs text-on-surface-variant">
                            {isTeacher
                              ? `${assignment.submissionCount ?? 0} submission(s)`
                              : assignment.hasSubmitted
                                ? "Submission received"
                                : "Waiting for hand-in"}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="auth-card rounded-[2rem] p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-brand-teal/70">
                    Create
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">
                    {isTeacher ? "Teacher assignment builder" : "Student visibility"}
                  </h2>
                </div>
                <BookOpenText className="h-6 w-6 text-brand-teal" />
              </div>

              {isTeacher ? (
                <div className="mt-5 space-y-4">
                  <input
                    value={assignmentTitle}
                    onChange={(event) => setAssignmentTitle(event.target.value)}
                    placeholder="Assignment title"
                    className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-on-surface-variant"
                  />
                  <textarea
                    value={assignmentDescription}
                    onChange={(event) => setAssignmentDescription(event.target.value)}
                    placeholder="Assignment description"
                    rows={5}
                    className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-on-surface-variant"
                  />
                  <input
                    type="datetime-local"
                    value={assignmentDueAt}
                    onChange={(event) => setAssignmentDueAt(event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAssignmentCreate}
                    disabled={busyAction === "assignment-create"}
                    className="auth-primary-button rounded-xl px-5 py-3 text-sm font-semibold"
                  >
                    {busyAction === "assignment-create" ? (
                      <>
                        <LoaderCircle className="auth-primary-button-icon h-4 w-4 animate-spin" />
                        Creating
                      </>
                    ) : (
                      <>
                        <Plus className="auth-primary-button-icon h-4 w-4" />
                        Create assignment
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="mt-5 rounded-[1.5rem] border border-dashed border-white/10 bg-black/20 p-5 text-sm text-on-surface-variant">
                  Students can review assignment instructions and deadlines here, but only teachers can post them.
                </div>
              )}
            </section>
          </div>
        ) : null}

        {activeTab === "hand-in" ? (
          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <section className="auth-panel rounded-[2rem] p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-[#78d7ff]/70">
                    Hand In
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">
                    Deadline-aware submission flow
                  </h2>
                </div>
                <FileCheck2 className="h-6 w-6 text-[#78d7ff]" />
              </div>

              {isStudent ? (
                <div className="mt-5 space-y-3">
                  {assignments.length === 0 ? (
                    <div className="rounded-[1.5rem] border border-dashed border-white/10 bg-black/20 p-5 text-sm text-on-surface-variant">
                      No assignments are available to submit yet.
                    </div>
                  ) : null}

                  {assignments.map((assignment) => {
                    const closed = new Date() > new Date(assignment.dueAt);

                    return (
                      <div key={assignment.id} className="auth-card rounded-[1.5rem] p-5">
                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-white">
                              {assignment.title}
                            </h3>
                            <p className="mt-2 text-sm text-on-surface-variant">
                              Due {formatDateTime(assignment.dueAt)}
                            </p>
                            <p className="mt-2 text-sm text-on-surface-variant">
                              {closed
                                ? "Submission closed after deadline"
                                : assignment.hasSubmitted
                                  ? "Submission already received. Upload again to replace it."
                                  : "Open for upload"}
                            </p>
                          </div>
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs uppercase tracking-[0.25em] ${
                              closed
                                ? "border-red-400/30 text-red-200"
                                : "border-brand-teal/30 text-brand-ice"
                            }`}
                          >
                            {closed ? "Closed" : "Open"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-5 space-y-3">
                  {submissions.length === 0 ? (
                    <div className="rounded-[1.5rem] border border-dashed border-white/10 bg-black/20 p-5 text-sm text-on-surface-variant">
                      No student submissions yet.
                    </div>
                  ) : null}

                  {submissions.map((submission) => (
                    <div key={submission.id} className="auth-card rounded-[1.5rem] p-5">
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-white">
                            {submission.assignmentTitle}
                          </h3>
                          <p className="mt-2 text-sm text-on-surface-variant">
                            {submission.student.displayName || submission.student.email}
                          </p>
                          <p className="mt-2 text-sm text-on-surface-variant">
                            {submission.fileName} · {formatBytes(submission.fileSizeBytes)}
                          </p>
                          <p className="mt-2 text-sm text-on-surface-variant">
                            Submitted {formatDateTime(submission.submittedAt)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => downloadSubmission(submission.id)}
                          className="auth-oauth-button rounded-xl px-4 py-3"
                        >
                          <Download className="h-4 w-4" />
                          Download
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="auth-card rounded-[2rem] p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-brand-lavender/70">
                    Upload
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">
                    {isStudent ? "Student hand-in uploader" : "Teacher review rules"}
                  </h2>
                </div>
                <Upload className="h-6 w-6 text-brand-lavender" />
              </div>

              {isStudent ? (
                <div className="mt-5 space-y-4">
                  <select
                    value={submissionAssignmentId}
                    onChange={(event) => setSubmissionAssignmentId(event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none"
                  >
                    <option value="">Select assignment</option>
                    {assignments.map((assignment) => (
                      <option key={assignment.id} value={assignment.id}>
                        {assignment.title}
                      </option>
                    ))}
                  </select>
                  <input
                    type="file"
                    onChange={(event) =>
                      setSubmissionFile(event.target.files?.[0] ?? null)
                    }
                    className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-on-surface-variant file:mr-4 file:rounded-xl file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-white"
                  />
                  <button
                    type="button"
                    onClick={handleSubmissionUpload}
                    disabled={busyAction === "submission-upload"}
                    className="auth-primary-button rounded-xl px-5 py-3 text-sm font-semibold"
                  >
                    {busyAction === "submission-upload" ? (
                      <>
                        <LoaderCircle className="auth-primary-button-icon h-4 w-4 animate-spin" />
                        Uploading
                      </>
                    ) : (
                      <>
                        <Upload className="auth-primary-button-icon h-4 w-4" />
                        Hand in assignment
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="mt-5 rounded-[1.5rem] border border-dashed border-white/10 bg-black/20 p-5 text-sm text-on-surface-variant">
                  Teachers can review every submission here. Student upload controls stay hidden by role.
                </div>
              )}
            </section>
          </div>
        ) : null}

        {activeTab === "announcement" ? (
          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <section className="auth-panel rounded-[2rem] p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-brand-lavender/70">
                    Announcement
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">
                    Broadcast classroom updates
                  </h2>
                </div>
                <Megaphone className="h-6 w-6 text-brand-lavender" />
              </div>

              <div className="mt-5 space-y-3">
                {announcements.length === 0 ? (
                  <div className="rounded-[1.5rem] border border-dashed border-white/10 bg-black/20 p-5 text-sm text-on-surface-variant">
                    No announcements posted yet.
                  </div>
                ) : null}

                {announcements.map((announcement) => (
                  <div key={announcement.id} className="auth-card rounded-[1.5rem] p-5">
                    <h3 className="text-lg font-semibold text-white">{announcement.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-on-surface-variant">
                      {announcement.body}
                    </p>
                    <p className="mt-3 text-sm text-on-surface-variant">
                      {announcement.teacher.displayName || announcement.teacher.email} ·{" "}
                      {formatDateTime(announcement.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="auth-card rounded-[2rem] p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-brand-teal/70">
                    Post
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">
                    {isTeacher ? "Teacher announcement form" : "Student visibility"}
                  </h2>
                </div>
                <CheckCircle2 className="h-6 w-6 text-brand-teal" />
              </div>

              {isTeacher ? (
                <div className="mt-5 space-y-4">
                  <input
                    value={announcementTitle}
                    onChange={(event) => setAnnouncementTitle(event.target.value)}
                    placeholder="Announcement title"
                    className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-on-surface-variant"
                  />
                  <textarea
                    value={announcementBody}
                    onChange={(event) => setAnnouncementBody(event.target.value)}
                    placeholder="Write the classroom update"
                    rows={6}
                    className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-on-surface-variant"
                  />
                  <button
                    type="button"
                    onClick={handleAnnouncementCreate}
                    disabled={busyAction === "announcement-create"}
                    className="auth-primary-button rounded-xl px-5 py-3 text-sm font-semibold"
                  >
                    {busyAction === "announcement-create" ? (
                      <>
                        <LoaderCircle className="auth-primary-button-icon h-4 w-4 animate-spin" />
                        Posting
                      </>
                    ) : (
                      <>
                        <Megaphone className="auth-primary-button-icon h-4 w-4" />
                        Post announcement
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="mt-5 rounded-[1.5rem] border border-dashed border-white/10 bg-black/20 p-5 text-sm text-on-surface-variant">
                  Students can read announcements instantly, but posting stays limited to teachers.
                </div>
              )}
            </section>
          </div>
        ) : null}

        {activeTab === "meeting" ? (
          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <section className="auth-panel rounded-[2rem] p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-brand-teal/70">Meeting</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">
                    UI-ready meeting hub
                  </h2>
                  <p className="mt-3 text-sm text-on-surface-variant">
                    This section is intentionally UI-only for now, with a disabled creation path and a join-ready visual list.
                  </p>
                </div>
                <Video className="h-6 w-6 text-brand-teal" />
              </div>

              <div className="mt-5 grid gap-4">
                {mockMeetings.map((meeting) => (
                  <div key={meeting.title} className="auth-card rounded-[1.5rem] p-5">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-white">{meeting.title}</h3>
                        <p className="mt-2 text-sm text-on-surface-variant">{meeting.time}</p>
                      </div>
                      <span className="rounded-full border border-brand-lavender/30 px-3 py-1 text-xs uppercase tracking-[0.25em] text-brand-ice">
                        {meeting.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="auth-card rounded-[2rem] p-6">
              <div className="space-y-5">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-brand-lavender/70">
                    Create Meeting
                  </p>
                  <button
                    type="button"
                    disabled
                    className="auth-oauth-button mt-3 w-full justify-center rounded-xl px-4 py-3 disabled:opacity-50"
                  >
                    Coming soon
                  </button>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-brand-teal/70">
                    Join Meeting
                  </p>
                  <Link
                    href="/dashboard"
                    className="auth-primary-button mt-3 inline-flex w-full justify-center rounded-xl px-4 py-3 text-sm font-semibold"
                  >
                    <Video className="auth-primary-button-icon h-4 w-4" />
                    Join Meeting
                  </Link>
                </div>
              </div>
            </section>
          </div>
        ) : null}
      </div>
    </WorkspaceShell>
  );
}
