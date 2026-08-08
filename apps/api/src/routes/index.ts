import { Router } from 'express';

import healthRoutes from './healthRoutes.js';
import cardRoutes from './cardRoutes.js';
import authRoutes from './authRoutes.js';
import matchRoutes from './matchRoutes.js';
import profileRoutes from './profileRoutes.js';
import rankingRoutes from './rankingRoutes.js';

import { tagRoutePrefix } from '../middlewares/tagRoutePrefix.js';

import { apiLimiter } from '../middlewares/rateLimiter.js';
import { authLimiter } from '../middlewares/authLimiter.js';
import { matchLimiter } from '../middlewares/matchLimiter.js';

const router = Router();

// Endpoint de comprobación (Health Check)
router.use('/health', tagRoutePrefix, healthRoutes);

// API de negocio -> v1
router.use('/v1/deck', tagRoutePrefix, apiLimiter, cardRoutes);

// Gestión de usuarios
router.use('/v1/auth', tagRoutePrefix, authLimiter, authRoutes);

// Perfil de jugador
router.use('/v1/profile', tagRoutePrefix, apiLimiter, profileRoutes);

// Partida solitario Orda
router.use('/v1/matches', tagRoutePrefix, matchLimiter, matchRoutes);

// Ranking público
router.use('/v1/ranking', tagRoutePrefix, apiLimiter, rankingRoutes);

export default router;
