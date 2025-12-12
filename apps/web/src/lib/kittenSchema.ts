import { z } from 'zod';

export const ColorHex = z
  .string()
  .trim()
  .regex(/^#[0-9a-fA-F]{6}$/);

export const KittenPresetSchema = z
  .object({
    version: z.literal(1),
    name: z.string().trim().min(0).max(40).default(''),

    fur: z.object({
      base: ColorHex,
      belly: ColorHex,
      outline: ColorHex,
      pattern: z.enum(['solid', 'tabby', 'tuxedo', 'calico']),
      patternIntensity: z.number().min(0).max(1),
    }),

    eyes: z.object({
      iris: ColorHex,
      pupil: ColorHex,
      shape: z.enum(['round', 'almond']),
      sparkle: z.boolean(),
    }),

    accessories: z.object({
      collarEnabled: z.boolean(),
      collar: ColorHex,
      bellEnabled: z.boolean(),
      bowEnabled: z.boolean(),
      glassesEnabled: z.boolean(),
      hat: z.enum(['none', 'party', 'beanie']),
    }),

    pose: z.object({
      mood: z.enum(['happy', 'curious', 'sleepy', 'grumpy']),
      tilt: z.number().min(-20).max(20),
    }),

    background: z.object({
      theme: z.enum(['midnight', 'sunrise', 'mint', 'candy']),
      confetti: z.boolean(),
    }),
  })
  .strict();

export type KittenPreset = z.infer<typeof KittenPresetSchema>;

export function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

export function clamp(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min;
  if (n < min) return min;
  if (n > max) return max;
  return n;
}

export function defaultPreset(): KittenPreset {
  return {
    version: 1,
    name: 'Mochi',
    fur: {
      base: '#d7a86e',
      belly: '#f4e6d3',
      outline: '#111827',
      pattern: 'tabby',
      patternIntensity: 0.55,
    },
    eyes: {
      iris: '#3bd16f',
      pupil: '#0b0f1a',
      shape: 'almond',
      sparkle: true,
    },
    accessories: {
      collarEnabled: true,
      collar: '#7c5cff',
      bellEnabled: true,
      bowEnabled: false,
      glassesEnabled: false,
      hat: 'none',
    },
    pose: {
      mood: 'curious',
      tilt: 0,
    },
    background: {
      theme: 'midnight',
      confetti: false,
    },
  };
}

export function safeParsePreset(input: unknown): KittenPreset | null {
  const parsed = KittenPresetSchema.safeParse(input);
  return parsed.success ? parsed.data : null;
}
