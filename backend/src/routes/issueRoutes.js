import { Router } from 'express';

import {
  listIssues,
  createIssue,
  supportIssue
} from '../controllers/issueController.js';

import {
  requireAuth,
  requireRole,
  optionalAuth
} from '../middleware/auth.js';

const r = Router();

// Public issue list.
// If a user is logged in, optionalAuth lets the controller
// determine whether that user has already supported each issue.
r.get('/', optionalAuth, listIssues);

// Create an issue
r.post(
  '/',
  requireAuth,
  requireRole('CITIZEN', 'OFFICER', 'ADMIN'),
  createIssue
);

// Support an existing issue
r.post(
  '/:id/support',
  requireAuth,
  requireRole('CITIZEN'),
  supportIssue
);

export default r;