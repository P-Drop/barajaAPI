import { z } from 'zod';

export const AVATARS = [
  '01_oros_saco.webp',
  '02_oros_bombon.webp',
  '03_oros_pirata.webp',
  '04_oros_buscador.webp',
  '05_copas_bebedor.webp',
  '06_copas_trofeo.webp',
  '07_copas_brindis.webp',
  '08_copas_malabarista.webp',
  '09_espadas_mosquetero.webp',
  '10_espadas_sardinas.webp',
  '11_espadas_escudo.webp',
  '12_bastos_rastafari.webp',
  '13_bastos_cavernicola.webp',
  '14_bastos_lenador.webp',
  '15_bastos_florece.webp',
  '16_oros_atardecer.webp',
  '17_espadas_esquiadora.webp',
  '18_bastos_homerun.webp',
  '19_espadas_katana.webp',
  '20_copas_jacuzzi.webp',
] as const;

export const registerSchema = z.object({
  nickname: z.string().regex(/^[a-zA-Z0-9_]{3,20}$/),
  password: z.string().min(10).max(128),
  avatar: z.enum(AVATARS),
});

export type RegisterInput = z.infer<typeof registerSchema>;
