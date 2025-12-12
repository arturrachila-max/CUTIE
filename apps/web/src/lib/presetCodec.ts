import type { KittenPreset } from './kittenSchema';
import { safeParsePreset } from './kittenSchema';

function base64UrlEncode(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]!);
  const b64 = btoa(bin);
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlDecodeToBytes(b64url: string): Uint8Array {
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
  const pad = b64.length % 4 === 0 ? '' : '='.repeat(4 - (b64.length % 4));
  const bin = atob(b64 + pad);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

export function encodePresetToUrlParam(preset: KittenPreset): string {
  // Small and deterministic; no PII; keep it simple.
  const json = JSON.stringify(preset);
  const bytes = new TextEncoder().encode(json);
  return base64UrlEncode(bytes);
}

export function decodePresetFromUrlParam(param: string): KittenPreset | null {
  if (!param || param.length > 6000) return null; // basic abuse guard
  try {
    const bytes = base64UrlDecodeToBytes(param);
    const json = new TextDecoder().decode(bytes);
    const obj = JSON.parse(json) as unknown;
    return safeParsePreset(obj);
  } catch {
    return null;
  }
}
