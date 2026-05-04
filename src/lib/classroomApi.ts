"use client";

import { backendFileRequest, backendRequest } from "@/lib/backendApi";

export type ClassroomRole = "student" | "teacher" | "admin" | null;

export type ClassroomNote = {
  id: string;
  title: string;
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  createdAt: string;
  teacher: {
    id: string;
    displayName: string | null;
    email: string;
  };
};

export type ClassroomAssignment = {
  id: string;
  title: string;
  description: string;
  dueAt: string;
  createdAt: string;
  teacher: {
    id: string;
    displayName: string | null;
    email: string;
  };
  submissionCount?: number;
  hasSubmitted?: boolean;
};

export type ClassroomSubmission = {
  id: string;
  assignmentId: string;
  assignmentTitle: string;
  student: {
    id: string;
    displayName: string | null;
    email: string;
  };
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  submittedAt: string;
};

export type ClassroomAnnouncement = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  teacher: {
    id: string;
    displayName: string | null;
    email: string;
  };
};

export type ClassroomStats = {
  role: ClassroomRole;
  cards: Array<{
    label: string;
    value: number;
    detail: string;
  }>;
};

export type FileUploadPayload = {
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  contentBase64: string;
};

export const getNotes = () =>
  backendRequest<{ role: ClassroomRole; notes: ClassroomNote[] }>("/api/notes");

export const createNote = (payload: { title: string; file: FileUploadPayload }) =>
  backendRequest<{ id: string }>("/api/notes", {
    method: "POST",
    body: payload,
  });

export const getAssignments = () =>
  backendRequest<{ role: ClassroomRole; assignments: ClassroomAssignment[] }>(
    "/api/assignments"
  );

export const createAssignment = (payload: {
  title: string;
  description: string;
  dueAt: string;
}) =>
  backendRequest<{ id: string }>("/api/assignments", {
    method: "POST",
    body: payload,
  });

export const getSubmissions = () =>
  backendRequest<{ role: ClassroomRole; submissions: ClassroomSubmission[] }>(
    "/api/submissions"
  );

export const createSubmission = (payload: {
  assignmentId: string;
  file: FileUploadPayload;
}) =>
  backendRequest<{ id: string }>("/api/submissions", {
    method: "POST",
    body: payload,
  });

export const getAnnouncements = () =>
  backendRequest<{
    role: ClassroomRole;
    announcements: ClassroomAnnouncement[];
  }>("/api/announcements");

export const createAnnouncement = (payload: { title: string; body: string }) =>
  backendRequest<{ id: string }>("/api/announcements", {
    method: "POST",
    body: payload,
  });

export const getClassroomStats = () => backendRequest<ClassroomStats>("/api/stats");

export async function downloadProtectedFile(path: string) {
  const response = await backendFileRequest(path);
  const blob = await response.blob();
  const disposition = response.headers.get("Content-Disposition") ?? "";
  const match = disposition.match(/filename="?([^"]+)"?/i);
  const fileName = match?.[1] ? decodeURIComponent(match[1]) : "download";

  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
}

export const downloadNote = (id: string) =>
  downloadProtectedFile(`/api/notes/${id}/download`);

export const downloadSubmission = (id: string) =>
  downloadProtectedFile(`/api/submissions/${id}/download`);

export async function fileToUploadPayload(file: File): Promise<FileUploadPayload> {
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result;

      if (typeof result !== "string") {
        reject(new Error("Failed to read file."));
        return;
      }

      const commaIndex = result.indexOf(",");
      resolve(commaIndex >= 0 ? result.slice(commaIndex + 1) : result);
    };

    reader.onerror = () => reject(new Error("Failed to read file."));
    reader.readAsDataURL(file);
  });

  return {
    fileName: file.name,
    mimeType: file.type || "application/octet-stream",
    fileSizeBytes: file.size,
    contentBase64: base64,
  };
}
