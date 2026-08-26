import {Router} from 'express';
import {listIssues,createIssue,supportIssue} from '../controllers/issueController.js';
import {requireAuth,requireRole} from '../middleware/auth.js';
const r=Router();
r.get('/',listIssues);
r.post('/',requireAuth,requireRole('CITIZEN','OFFICER','ADMIN'),createIssue);
r.post('/:id/support',requireAuth,requireRole('CITIZEN'),supportIssue);
export default r;
