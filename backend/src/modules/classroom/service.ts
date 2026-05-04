import { PoolClient } from 'pg';

import { pool } from '../../database';
import type {
  AnnouncementRecord,
  AssignmentRecord,
  ClassroomProfile,
  ClassroomRole,
  NoteRecord,
  StatsResponse,
  SubmissionRecord,
} from './types';
import type {
  AnnouncementCreateInput,
  AssignmentCreateInput,
  NoteUploadInput,
  SubmissionCreateInput,
} from './validators';

class ForbiddenError extends Error {}
class NotFoundError extends Error {}
class RequestValidationError extends Error {}

let classroomSchemaReady: Promise<void> | null = null;

export function isForbiddenError(error: unknown): error is ForbiddenError {
  return error instanceof ForbiddenError;
}

export function isNotFoundError(error: unknown): error is NotFoundError {
  return error instanceof NotFoundError;
}

export function isRequestValidationError(
  error: unknown
): error is RequestValidationError {
  return error instanceof RequestValidationError;
}

async function ensureClassroomSchema() {
  if (!classroomSchemaReady) {
    classroomSchemaReady = (async () => {
      const client = await pool.connect();

      try {
        await client.query(`
          CREATE TABLE IF NOT EXISTS classroom_notes (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
            title VARCHAR(255) NOT NULL,
            file_name VARCHAR(255) NOT NULL,
            mime_type VARCHAR(255) NOT NULL,
            file_size_bytes INT NOT NULL CHECK (file_size_bytes >= 0),
            content_base64 TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );

          CREATE TABLE IF NOT EXISTS classroom_assignments (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
            title VARCHAR(255) NOT NULL,
            description TEXT NOT NULL,
            due_at TIMESTAMP WITH TIME ZONE NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );

          CREATE TABLE IF NOT EXISTS classroom_submissions (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            assignment_id UUID NOT NULL REFERENCES classroom_assignments(id) ON DELETE CASCADE,
            student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
            file_name VARCHAR(255) NOT NULL,
            mime_type VARCHAR(255) NOT NULL,
            file_size_bytes INT NOT NULL CHECK (file_size_bytes >= 0),
            content_base64 TEXT NOT NULL,
            submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            UNIQUE (assignment_id, student_id)
          );

          CREATE TABLE IF NOT EXISTS classroom_announcements (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
            title VARCHAR(255) NOT NULL,
            body TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );

          CREATE INDEX IF NOT EXISTS idx_classroom_notes_teacher_created
            ON classroom_notes(teacher_id, created_at DESC);
          CREATE INDEX IF NOT EXISTS idx_classroom_assignments_teacher_due
            ON classroom_assignments(teacher_id, due_at DESC);
          CREATE INDEX IF NOT EXISTS idx_classroom_submissions_assignment
            ON classroom_submissions(assignment_id, submitted_at DESC);
          CREATE INDEX IF NOT EXISTS idx_classroom_submissions_student
            ON classroom_submissions(student_id, submitted_at DESC);
          CREATE INDEX IF NOT EXISTS idx_classroom_announcements_created
            ON classroom_announcements(created_at DESC);
        `);
      } finally {
        client.release();
      }
    })().catch((error) => {
      classroomSchemaReady = null;
      throw error;
    });
  }

  await classroomSchemaReady;
}

async function getProfileById(
  profileId: string,
  client?: PoolClient
): Promise<ClassroomProfile> {
  await ensureClassroomSchema();
  const queryClient = client ?? pool;
  const result = await queryClient.query<{
    id: string;
    email: string;
    display_name: string | null;
    role: ClassroomRole | null;
  }>(
    `
      SELECT id, email, display_name, role
      FROM profiles
      WHERE id = $1
    `,
    [profileId]
  );

  if (result.rowCount === 0) {
    throw new NotFoundError('Profile not found');
  }

  const row = result.rows[0];
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    role: row.role,
  };
}

function assertTeacher(profile: ClassroomProfile) {
  if (profile.role !== 'teacher' && profile.role !== 'admin') {
    throw new ForbiddenError('Only teachers can perform this action');
  }
}

function assertStudent(profile: ClassroomProfile) {
  if (profile.role !== 'student') {
    throw new ForbiddenError('Only students can perform this action');
  }
}

function assertBase64(value: string) {
  try {
    Buffer.from(value, 'base64');
  } catch {
    throw new RequestValidationError('Invalid file payload');
  }
}

export async function listNotes(actorId: string) {
  const actor = await getProfileById(actorId);
  await ensureClassroomSchema();

  const result = await pool.query<{
    id: string;
    title: string;
    file_name: string;
    mime_type: string;
    file_size_bytes: number;
    created_at: Date;
    teacher_id: string;
    teacher_name: string | null;
    teacher_email: string;
  }>(
    `
      SELECT
        n.id,
        n.title,
        n.file_name,
        n.mime_type,
        n.file_size_bytes,
        n.created_at,
        p.id AS teacher_id,
        p.display_name AS teacher_name,
        p.email AS teacher_email
      FROM classroom_notes n
      JOIN profiles p ON p.id = n.teacher_id
      ORDER BY n.created_at DESC
    `
  );

  return {
    role: actor.role,
    notes: result.rows.map<NoteRecord>((row) => ({
      id: row.id,
      title: row.title,
      fileName: row.file_name,
      mimeType: row.mime_type,
      fileSizeBytes: row.file_size_bytes,
      createdAt: row.created_at.toISOString(),
      teacher: {
        id: row.teacher_id,
        displayName: row.teacher_name,
        email: row.teacher_email,
      },
    })),
  };
}

export async function createNote(actorId: string, input: NoteUploadInput) {
  const actor = await getProfileById(actorId);
  assertTeacher(actor);
  assertBase64(input.file.contentBase64);
  await ensureClassroomSchema();

  const result = await pool.query<{ id: string }>(
    `
      INSERT INTO classroom_notes (
        teacher_id,
        title,
        file_name,
        mime_type,
        file_size_bytes,
        content_base64
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `,
    [
      actor.id,
      input.title,
      input.file.fileName,
      input.file.mimeType,
      input.file.fileSizeBytes,
      input.file.contentBase64,
    ]
  );

  return { id: result.rows[0].id };
}

export async function downloadNote(actorId: string, noteId: string) {
  await getProfileById(actorId);
  await ensureClassroomSchema();

  const result = await pool.query<{
    file_name: string;
    mime_type: string;
    content_base64: string;
  }>(
    `
      SELECT file_name, mime_type, content_base64
      FROM classroom_notes
      WHERE id = $1
    `,
    [noteId]
  );

  if (result.rowCount === 0) {
    throw new NotFoundError('Note not found');
  }

  const row = result.rows[0];
  return {
    fileName: row.file_name,
    mimeType: row.mime_type,
    buffer: Buffer.from(row.content_base64, 'base64'),
  };
}

export async function listAssignments(actorId: string) {
  const actor = await getProfileById(actorId);
  await ensureClassroomSchema();
  const isTeacher = actor.role === 'teacher' || actor.role === 'admin';

  const query =
    isTeacher
      ? `
        SELECT
          a.id,
          a.title,
          a.description,
          a.due_at,
          a.created_at,
          p.id AS teacher_id,
          p.display_name AS teacher_name,
          p.email AS teacher_email,
          COUNT(s.id)::int AS submission_count
        FROM classroom_assignments a
        JOIN profiles p ON p.id = a.teacher_id
        LEFT JOIN classroom_submissions s ON s.assignment_id = a.id
        GROUP BY a.id, p.id, p.display_name, p.email
        ORDER BY a.due_at ASC, a.created_at DESC
      `
      : `
        SELECT
          a.id,
          a.title,
          a.description,
          a.due_at,
          a.created_at,
          p.id AS teacher_id,
          p.display_name AS teacher_name,
          p.email AS teacher_email,
          CASE WHEN student_submission.id IS NULL THEN false ELSE true END AS has_submitted
        FROM classroom_assignments a
        JOIN profiles p ON p.id = a.teacher_id
        LEFT JOIN classroom_submissions student_submission
          ON student_submission.assignment_id = a.id
          AND student_submission.student_id = $1
        ORDER BY a.due_at ASC, a.created_at DESC
      `;

  const result = await pool.query<{
    id: string;
    title: string;
    description: string;
    due_at: Date;
    created_at: Date;
    teacher_id: string;
    teacher_name: string | null;
    teacher_email: string;
    submission_count?: number;
    has_submitted?: boolean;
  }>(query, isTeacher ? undefined : [actor.id]);

  return {
    role: actor.role,
    assignments: result.rows.map<AssignmentRecord>((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      dueAt: row.due_at.toISOString(),
      createdAt: row.created_at.toISOString(),
      teacher: {
        id: row.teacher_id,
        displayName: row.teacher_name,
        email: row.teacher_email,
      },
      submissionCount: row.submission_count,
      hasSubmitted: row.has_submitted,
    })),
  };
}

export async function createAssignment(
  actorId: string,
  input: AssignmentCreateInput
) {
  const actor = await getProfileById(actorId);
  assertTeacher(actor);
  await ensureClassroomSchema();

  const dueAt = new Date(input.dueAt);
  if (Number.isNaN(dueAt.getTime())) {
    throw new RequestValidationError('Invalid due date');
  }

  const result = await pool.query<{ id: string }>(
    `
      INSERT INTO classroom_assignments (teacher_id, title, description, due_at)
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `,
    [actor.id, input.title, input.description, dueAt.toISOString()]
  );

  return { id: result.rows[0].id };
}

export async function listSubmissions(actorId: string) {
  const actor = await getProfileById(actorId);
  await ensureClassroomSchema();
  const isTeacher = actor.role === 'teacher' || actor.role === 'admin';

  const teacherQuery = `
    SELECT
      s.id,
      s.assignment_id,
      a.title AS assignment_title,
      student.id AS student_id,
      student.display_name AS student_name,
      student.email AS student_email,
      s.file_name,
      s.mime_type,
      s.file_size_bytes,
      s.submitted_at
    FROM classroom_submissions s
    JOIN classroom_assignments a ON a.id = s.assignment_id
    JOIN profiles student ON student.id = s.student_id
    ORDER BY s.submitted_at DESC
  `;

  const studentQuery = `
    SELECT
      s.id,
      s.assignment_id,
      a.title AS assignment_title,
      student.id AS student_id,
      student.display_name AS student_name,
      student.email AS student_email,
      s.file_name,
      s.mime_type,
      s.file_size_bytes,
      s.submitted_at
    FROM classroom_submissions s
    JOIN classroom_assignments a ON a.id = s.assignment_id
    JOIN profiles student ON student.id = s.student_id
    WHERE s.student_id = $1
    ORDER BY s.submitted_at DESC
  `;

  const result = await pool.query<{
    id: string;
    assignment_id: string;
    assignment_title: string;
    student_id: string;
    student_name: string | null;
    student_email: string;
    file_name: string;
    mime_type: string;
    file_size_bytes: number;
    submitted_at: Date;
  }>(isTeacher ? teacherQuery : studentQuery, isTeacher ? undefined : [actor.id]);

  return {
    role: actor.role,
    submissions: result.rows.map<SubmissionRecord>((row) => ({
      id: row.id,
      assignmentId: row.assignment_id,
      assignmentTitle: row.assignment_title,
      student: {
        id: row.student_id,
        displayName: row.student_name,
        email: row.student_email,
      },
      fileName: row.file_name,
      mimeType: row.mime_type,
      fileSizeBytes: row.file_size_bytes,
      submittedAt: row.submitted_at.toISOString(),
    })),
  };
}

export async function createSubmission(
  actorId: string,
  input: SubmissionCreateInput
) {
  const actor = await getProfileById(actorId);
  assertStudent(actor);
  assertBase64(input.file.contentBase64);
  await ensureClassroomSchema();

  const assignmentResult = await pool.query<{ due_at: Date }>(
    `
      SELECT due_at
      FROM classroom_assignments
      WHERE id = $1
    `,
    [input.assignmentId]
  );

  if (assignmentResult.rowCount === 0) {
    throw new NotFoundError('Assignment not found');
  }

  const dueAt = assignmentResult.rows[0].due_at;
  if (new Date() > dueAt) {
    throw new RequestValidationError('Submission closed after deadline');
  }

  const result = await pool.query<{ id: string }>(
    `
      INSERT INTO classroom_submissions (
        assignment_id,
        student_id,
        file_name,
        mime_type,
        file_size_bytes,
        content_base64,
        submitted_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      ON CONFLICT (assignment_id, student_id)
      DO UPDATE SET
        file_name = EXCLUDED.file_name,
        mime_type = EXCLUDED.mime_type,
        file_size_bytes = EXCLUDED.file_size_bytes,
        content_base64 = EXCLUDED.content_base64,
        submitted_at = NOW()
      RETURNING id
    `,
    [
      input.assignmentId,
      actor.id,
      input.file.fileName,
      input.file.mimeType,
      input.file.fileSizeBytes,
      input.file.contentBase64,
    ]
  );

  return { id: result.rows[0].id };
}

export async function downloadSubmission(actorId: string, submissionId: string) {
  const actor = await getProfileById(actorId);
  await ensureClassroomSchema();

  const result = await pool.query<{
    student_id: string;
    file_name: string;
    mime_type: string;
    content_base64: string;
  }>(
    `
      SELECT student_id, file_name, mime_type, content_base64
      FROM classroom_submissions
      WHERE id = $1
    `,
    [submissionId]
  );

  if (result.rowCount === 0) {
    throw new NotFoundError('Submission not found');
  }

  const row = result.rows[0];
  if (actor.role === 'student' && row.student_id !== actor.id) {
    throw new ForbiddenError('You cannot download another student submission');
  }

  return {
    fileName: row.file_name,
    mimeType: row.mime_type,
    buffer: Buffer.from(row.content_base64, 'base64'),
  };
}

export async function listAnnouncements(actorId: string) {
  const actor = await getProfileById(actorId);
  await ensureClassroomSchema();

  const result = await pool.query<{
    id: string;
    title: string;
    body: string;
    created_at: Date;
    teacher_id: string;
    teacher_name: string | null;
    teacher_email: string;
  }>(
    `
      SELECT
        a.id,
        a.title,
        a.body,
        a.created_at,
        p.id AS teacher_id,
        p.display_name AS teacher_name,
        p.email AS teacher_email
      FROM classroom_announcements a
      JOIN profiles p ON p.id = a.teacher_id
      ORDER BY a.created_at DESC
    `
  );

  return {
    role: actor.role,
    announcements: result.rows.map<AnnouncementRecord>((row) => ({
      id: row.id,
      title: row.title,
      body: row.body,
      createdAt: row.created_at.toISOString(),
      teacher: {
        id: row.teacher_id,
        displayName: row.teacher_name,
        email: row.teacher_email,
      },
    })),
  };
}

export async function createAnnouncement(
  actorId: string,
  input: AnnouncementCreateInput
) {
  const actor = await getProfileById(actorId);
  assertTeacher(actor);
  await ensureClassroomSchema();

  const result = await pool.query<{ id: string }>(
    `
      INSERT INTO classroom_announcements (teacher_id, title, body)
      VALUES ($1, $2, $3)
      RETURNING id
    `,
    [actor.id, input.title, input.body]
  );

  return { id: result.rows[0].id };
}

export async function getStats(actorId: string): Promise<StatsResponse> {
  const actor = await getProfileById(actorId);
  await ensureClassroomSchema();

  if (actor.role === 'teacher' || actor.role === 'admin') {
    const result = await pool.query<{
      classes_taken: string;
      assignments_created: string;
      notes_uploaded: string;
    }>(
      `
        SELECT
          (
            SELECT COUNT(*)
            FROM meetings
            WHERE created_by = $1
          )::text AS classes_taken,
          (
            SELECT COUNT(*)
            FROM classroom_assignments
            WHERE teacher_id = $1
          )::text AS assignments_created,
          (
            SELECT COUNT(*)
            FROM classroom_notes
            WHERE teacher_id = $1
          )::text AS notes_uploaded
      `,
      [actor.id]
    );

    const row = result.rows[0];
    return {
      role: actor.role,
      cards: [
        {
          label: 'Classes Taken',
          value: Number(row.classes_taken),
          detail: 'Meeting sessions created in Lumina',
        },
        {
          label: 'Assignments Created',
          value: Number(row.assignments_created),
          detail: 'Assignments published in Classroom',
        },
        {
          label: 'Notes Uploaded',
          value: Number(row.notes_uploaded),
          detail: 'Shared classroom note files',
        },
      ],
    };
  }

  const result = await pool.query<{
    classes_attended: string;
    assignments_submitted: string;
  }>(
    `
      SELECT
        (
          SELECT COUNT(*)
          FROM meetings
          WHERE participants @> ARRAY[$1::uuid]
        )::text AS classes_attended,
        (
          SELECT COUNT(*)
          FROM classroom_submissions
          WHERE student_id = $1
        )::text AS assignments_submitted
    `,
    [actor.id]
  );

  const row = result.rows[0];
  return {
    role: actor.role,
    cards: [
      {
        label: 'Classes Attended',
        value: Number(row.classes_attended),
        detail: 'Meeting sessions joined as a student',
      },
      {
        label: 'Assignments Submitted',
        value: Number(row.assignments_submitted),
        detail: 'Hand-ins uploaded before the deadline',
      },
    ],
  };
}
