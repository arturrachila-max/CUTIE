import type { KittenPreset } from './kittenSchema';

export async function validatePresetWithWorker(preset: KittenPreset): Promise<KittenPreset | null> {
  try {
    const res = await fetch('/api/validate-preset', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(preset),
    });

    if (!res.ok) return null;
    const data = (await res.json()) as unknown;

    // We still treat the Worker response as untrusted on the client.
    if (
      typeof data === 'object' &&
      data !== null &&
      'ok' in data &&
      (data as any).ok === true &&
      'preset' in data
    ) {
      return (data as any).preset as KittenPreset;
    }

    return null;
  } catch {
    return null;
  }
}
