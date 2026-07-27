import { Router } from 'express';

import healthRoutes from './healthRoutes.js';
import cardRoutes from './cardRoutes.js';
import authRoutes from './authRoutes.js';
import matchRoutes from './matchRoutes.js';
import profileRoutes from './profileRoutes.js';
import rankingRoutes from './rankingRoutes.js';

import { apiLimiter } from '../middlewares/rateLimiter.js';
import { authLimiter } from '../middlewares/authLimiter.js';

const router = Router();

// Endpoint de comprobación (Health Check)
router.use('/health', healthRoutes);

// API de negocio -> v1
router.use('/v1/deck', apiLimiter, cardRoutes);

// Gestión de usuarios
router.use('/v1/auth', authLimiter, authRoutes);

// Perfil de jugador
router.use('/v1/profile', apiLimiter, profileRoutes);

// Partida solitario Orda
router.use('/v1/matches', apiLimiter, matchRoutes);

// Ranking público
router.use('/v1/ranking', apiLimiter, rankingRoutes);

export default router;
