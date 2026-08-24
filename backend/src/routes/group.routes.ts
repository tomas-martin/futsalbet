import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import {
  createGroup,
  joinGroup,
  getMyGroups,
  getGroupDetails,
  getGroupRanking,
  leaveGroup,
  deleteGroup,
} from '../controllers/group.controller';

export const groupRouter = Router();

// All group routes require authentication
groupRouter.use(authenticate);

groupRouter.post('/', createGroup);
groupRouter.post('/join', joinGroup);
groupRouter.get('/my', getMyGroups);
groupRouter.get('/:id', getGroupDetails);
groupRouter.get('/:id/ranking', getGroupRanking);
groupRouter.post('/:id/leave', leaveGroup);
groupRouter.delete('/:id', deleteGroup);
