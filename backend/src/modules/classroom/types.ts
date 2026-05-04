export type ClassroomRole = 'student' | 'teacher' | 'admin';

export type ClassroomProfile = {
  id: string;
  email: string;
  displayName: string | null;
  role: ClassroomRole | null;
};

export type NoteRecord = {
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

export type AssignmentRecord = {
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

export type SubmissionRecord = {
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

export type AnnouncementRecord = {
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

export type StatsResponse = {
  role: ClassroomRole | null;
  cards: Array<{
    label: string;
    value: number;
    detail: string;
  }>;
};
