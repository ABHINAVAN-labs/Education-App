import { Request, Response, Router } from 'express';
import { ZodError } from 'zod';

import { authMiddleware } from '../../middleware/auth';
import {
  createAnnouncement,
  createAssignment,
  createNote,
  createSubmission,
  downloadNote,
  downloadSubmission,
  getStats,
  isForbiddenError,
  isNotFoundError,
  isRequestValidationError,
  listAnnouncements,
  listAssignments,
  listNotes,
  listSubmissions,
} from './service';
import {
  announcementCreateSchema,
  assignmentCreateSchema,
  noteUploadSchema,
  resourceIdParamsSchema,
  submissionCreateSchema,
} from './validators';

const router = Router();

router.use(authMiddleware);

router.get('/notes', async (req: Request, res: Response) => {
  try {
    const result = await listNotes(req.user!.id);
    res.json(result);
  } catch (error) {
    handleRouteError(res, error);
  }
});

router.post('/notes', async (req: Request, res: Response) => {
  try {
    const input = noteUploadSchema.parse(req.body);
    const result = await createNote(req.user!.id, input);
    res.status(201).json(result);
  } catch (error) {
    handleRouteError(res, error);
  }
});

router.get('/notes/:id/download', async (req: Request, res: Response) => {
  try {
    const { id } = resourceIdParamsSchema.parse(req.params);
    const result = await downloadNote(req.user!.id, id);
    res.setHeader('Content-Type', result.mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(result.fileName)}"`
    );
    res.send(result.buffer);
  } catch (error) {
    handleRouteError(res, error);
  }
});

router.get('/assignments', async (req: Request, res: Response) => {
  try {
    const result = await listAssignments(req.user!.id);
    res.json(result);
  } catch (error) {
    handleRouteError(res, error);
  }
});

router.post('/assignments', async (req: Request, res: Response) => {
  try {
    const input = assignmentCreateSchema.parse(req.body);
    const result = await createAssignment(req.user!.id, input);
    res.status(201).json(result);
  } catch (error) {
    handleRouteError(res, error);
  }
});

router.get('/submissions', async (req: Request, res: Response) => {
  try {
    const result = await listSubmissions(req.user!.id);
    res.json(result);
  } catch (error) {
    handleRouteError(res, error);
  }
});

router.post('/submissions', async (req: Request, res: Response) => {
  try {
    const input = submissionCreateSchema.parse(req.body);
    const result = await createSubmission(req.user!.id, input);
    res.status(201).json(result);
  } catch (error) {
    handleRouteError(res, error);
  }
});

router.get('/submissions/:id/download', async (req: Request, res: Response) => {
  try {
    const { id } = resourceIdParamsSchema.parse(req.params);
    const result = await downloadSubmission(req.user!.id, id);
    res.setHeader('Content-Type', result.mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(result.fileName)}"`
    );
    res.send(result.buffer);
  } catch (error) {
    handleRouteError(res, error);
  }
});

router.get('/announcements', async (req: Request, res: Response) => {
  try {
    const result = await listAnnouncements(req.user!.id);
    res.json(result);
  } catch (error) {
    handleRouteError(res, error);
  }
});

router.post('/announcements', async (req: Request, res: Response) => {
  try {
    const input = announcementCreateSchema.parse(req.body);
    const result = await createAnnouncement(req.user!.id, input);
    res.status(201).json(result);
  } catch (error) {
    handleRouteError(res, error);
  }
});

router.get('/stats', async (req: Request, res: Response) => {
  try {
    const result = await getStats(req.user!.id);
    res.json(result);
  } catch (error) {
    handleRouteError(res, error);
  }
});

function handleRouteError(res: Response, error: unknown) {
  if (error instanceof ZodError) {
    res.status(400).json({
      error: 'Invalid request payload',
      details: error.issues,
    });
    return;
  }

  if (isRequestValidationError(error)) {
    res.status(400).json({ error: error.message });
    return;
  }

  if (isForbiddenError(error)) {
    res.status(403).json({ error: error.message });
    return;
  }

  if (isNotFoundError(error)) {
    res.status(404).json({ error: error.message });
    return;
  }

  console.error('Classroom route error:', error);
  res.status(500).json({ error: 'Internal server error' });
}

export default router;
