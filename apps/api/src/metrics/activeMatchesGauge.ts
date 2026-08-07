import { env } from '../config/env.js';
import client from 'prom-client';
import { logger } from '../config/logger.js';
import { register } from '../config/metrics.js';
import { matchRepository } from '../repositories/matchRepository.js';

export const ordaMatchesActive = new client.Gauge({
  name: 'orda_matches_active',
  help: 'Partidas en curso (no caducadas)',
  registers: [register],
  async collect() {
    try {
      const since = new Date(Date.now() - env.MATCH_TTL_MINUTES * 60_000);
      this.set(await matchRepository.countActive(since));
    } catch (err) {
      logger.debug({ err }, 'No se pudo leer orda_matches_active');
    }
  },
});
