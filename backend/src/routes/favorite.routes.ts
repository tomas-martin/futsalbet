import { Router } from 'express';
import {
  getFavorites,
  addFavoriteTeam,
  removeFavoriteTeam,
  addFavoriteTournament,
  removeFavoriteTournament,
} from '../controllers/favorite.controller';
import { authenticate } from '../middlewares/auth.middleware';

export const favoriteRouter = Router();

favoriteRouter.use(authenticate);

favoriteRouter.get('/', getFavorites);
favoriteRouter.post('/teams', addFavoriteTeam);
favoriteRouter.delete('/teams/:teamId', removeFavoriteTeam);
favoriteRouter.post('/tournaments', addFavoriteTournament);
favoriteRouter.delete('/tournaments/:tournamentId', removeFavoriteTournament);
