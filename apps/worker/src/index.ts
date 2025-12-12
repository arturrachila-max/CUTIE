import { z } from 'zod';

type Env = {
  ALLOWED_ORIGINS?: string;
};

const MAX_BODY_BYTES = 30_000;

const ColorHex = z
  .string()
  .trim()
  .regex(/^#[0-9a-fA-F]{6}$/);

const KittenPresetSchema = z
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

function jsonResponse(body: unknown, init?: ResponseInit): Response {
  const headers = new Headers(init?.headers);
  headers.set('content-type', 'application/json; charset=utf-8');
  headers.set('x-content-type-options', 'nosniff');
  headers.set('referrer-policy', 'no-referrer');
  headers.set('x-frame-options', 'DENY');
  headers.set('cache-control', 'no-store');
  return new Response(JSON.stringify(body), { ...init, headers });
}

function getAllowedOrigin(request: Request, env: Env): string | null {
  const origin = request.headers.get('origin');
  if (!origin) return null;

  const allowList = (env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  if (allowList.includes(origin)) return origin;
  return null;
}

function withCorsHeaders(res: Response, origin: string | null): Response {
  if (!origin) return res;
  const headers = new Headers(res.headers);
  headers.set('access-control-allow-origin', origin);
  headers.set('vary', 'origin');
  headers.set('access-control-allow-methods', 'GET,POST,OPTIONS');
  headers.set('access-control-allow-headers', 'content-type');
  headers.set('access-control-max-age', '600');
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
}

async function readJsonBodyLimited(request: Request): Promise<unknown> {
  const contentType = request.headers.get('content-type') || '';
  if (!contentType.toLowerCase().includes('application/json')) {
    throw new Error('invalid_content_type');
  }

  const len = Number(request.headers.get('content-length') || '0');
  if (Number.isFinite(len) && len > MAX_BODY_BYTES) throw new Error('too_large');

  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) throw new Error('too_large');

  try {
    return JSON.parse(text);
  } catch {
    throw new Error('invalid_json');
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    const corsOrigin = getAllowedOrigin(request, env);

    if (request.method === 'OPTIONS') {
      return withCorsHeaders(new Response(null, { status: 204 }), corsOrigin);
    }

    if (request.method === 'GET' && path === '/api/health') {
      return withCorsHeaders(jsonResponse({ ok: true }), corsOrigin);
    }

    if (request.method === 'POST' && path === '/api/validate-preset') {
      try {
        const body = await readJsonBodyLimited(request);
        const parsed = KittenPresetSchema.safeParse(body);
        if (!parsed.success) {
          return withCorsHeaders(jsonResponse({ ok: false, error: 'Invalid request' }, { status: 400 }), corsOrigin);
        }

        // Return only the validated/sanitized preset.
        return withCorsHeaders(jsonResponse({ ok: true, preset: parsed.data }), corsOrigin);
      } catch (err) {
        // Never leak internal details.
        const code = err instanceof Error ? err.message : 'unknown';
        const status = code === 'too_large' ? 413 : 400;
        return withCorsHeaders(jsonResponse({ ok: false, error: 'Invalid request' }, { status }), corsOrigin);
      }
    }

    return withCorsHeaders(jsonResponse({ ok: false, error: 'Not found' }, { status: 404 }), corsOrigin);
  },
};
