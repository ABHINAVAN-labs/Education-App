import { z } from 'zod';

const uuidSchema = z.uuid();
const isoDatetimeSchema = z.iso.datetime();

const filePayloadSchema = z.object({
  fileName: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(255),
  fileSizeBytes: z.number().int().nonnegative().max(15 * 1024 * 1024),
  contentBase64: z.string().min(1),
});

export const noteUploadSchema = z.object({
  title: z.string().min(1).max(255),
  file: filePayloadSchema,
});

export const assignmentCreateSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().min(1).max(5000),
  dueAt: isoDatetimeSchema,
});

export const submissionCreateSchema = z.object({
  assignmentId: uuidSchema,
  file: filePayloadSchema,
});

export const announcementCreateSchema = z.object({
  title: z.string().min(1).max(255),
  body: z.string().min(1).max(5000),
});

export const resourceIdParamsSchema = z.object({
  id: uuidSchema,
});

export type NoteUploadInput = z.infer<typeof noteUploadSchema>;
export type AssignmentCreateInput = z.infer<typeof assignmentCreateSchema>;
export type SubmissionCreateInput = z.infer<typeof submissionCreateSchema>;
export type AnnouncementCreateInput = z.infer<typeof announcementCreateSchema>;
