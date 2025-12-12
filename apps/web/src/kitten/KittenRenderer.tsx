import React from 'react';
import type { KittenPreset } from '../lib/kittenSchema';

const THEMES: Record<KittenPreset['background']['theme'], { a: string; b: string; c: string }> = {
  midnight: { a: '#0b1020', b: '#26185f', c: '#0a2d3b' },
  sunrise: { a: '#1a0f16', b: '#ff7a59', c: '#ffd36e' },
  mint: { a: '#081817', b: '#1dd6b6', c: '#b6ffd9' },
  candy: { a: '#120a1b', b: '#ff4d6d', c: '#7c5cff' },
};

function seededFloat(seed: number): number {
  // deterministic pseudo-random in [0,1)
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function mixHex(a: string, b: string, t: number): string {
  const pa = a.replace('#', '');
  const pb = b.replace('#', '');
  const ar = parseInt(pa.slice(0, 2), 16);
  const ag = parseInt(pa.slice(2, 4), 16);
  const ab = parseInt(pa.slice(4, 6), 16);
  const br = parseInt(pb.slice(0, 2), 16);
  const bg = parseInt(pb.slice(2, 4), 16);
  const bb = parseInt(pb.slice(4, 6), 16);
  const rr = Math.round(ar + (br - ar) * t);
  const rg = Math.round(ag + (bg - ag) * t);
  const rb = Math.round(ab + (bb - ab) * t);
  const hex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${hex(rr)}${hex(rg)}${hex(rb)}`;
}

export function KittenRenderer({ preset }: { preset: KittenPreset }) {
  const { fur, eyes, accessories, pose, background } = preset;
  const theme = THEMES[background.theme];

  const stripes = mixHex(fur.base, fur.outline, 0.5);
  const calico1 = mixHex(fur.base, '#ff8a4c', 0.35);
  const calico2 = mixHex(fur.base, '#ffffff', 0.55);

  const intensity = Math.max(0, Math.min(1, fur.patternIntensity));
  const stroke = fur.outline;

  const eyeW = eyes.shape === 'almond' ? 44 : 42;
  const eyeH = eyes.shape === 'almond' ? 30 : 36;

  const mouthY = pose.mood === 'sleepy' ? 265 : pose.mood === 'grumpy' ? 262 : 263;
  const mouthSmile = pose.mood === 'grumpy' ? -10 : pose.mood === 'sleepy' ? -2 : 12;

  const lid = pose.mood === 'sleepy' ? 0.55 : 0;

  const tilt = pose.tilt;

  // Confetti is deterministic (no animation here, just decorative dots)
  const confettiDots = background.confetti
    ? Array.from({ length: 24 }).map((_, i) => {
        const t = seededFloat(i * 97 + 11);
        const u = seededFloat(i * 131 + 29);
        const r = 2 + seededFloat(i * 41 + 7) * 5;
        const colors = ['#7c5cff', '#28d7ff', '#ff4d6d', '#3bd16f', '#ffd36e'];
        const fill = colors[i % colors.length]!;
        return { cx: 80 + t * 340, cy: 70 + u * 360, r, fill };
      })
    : [];

  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 500 500"
      role="img"
      aria-label="Customized kitten"
    >
      <defs>
        <radialGradient id="bg" cx="30%" cy="25%" r="80%">
          <stop offset="0%" stopColor={mixHex(theme.b, '#ffffff', 0.1)} stopOpacity={0.7} />
          <stop offset="55%" stopColor={theme.b} stopOpacity={0.22} />
          <stop offset="100%" stopColor={theme.a} stopOpacity={1} />
        </radialGradient>

        <linearGradient id="shine" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.18" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0.02" />
        </linearGradient>

        <pattern id="tabby" width="30" height="30" patternUnits="userSpaceOnUse">
          <path
            d="M 0 10 C 7 5, 14 5, 22 10 S 37 15, 44 10"
            fill="none"
            stroke={stripes}
            strokeOpacity={0.35 + 0.45 * intensity}
            strokeWidth={6}
            strokeLinecap="round"
          />
        </pattern>

        <pattern id="tuxedo" width="48" height="48" patternUnits="userSpaceOnUse">
          <circle cx="14" cy="18" r="10" fill={mixHex(fur.outline, fur.base, 0.2)} fillOpacity={0.30 + 0.55 * intensity} />
          <circle cx="34" cy="34" r="12" fill={mixHex(fur.outline, fur.base, 0.25)} fillOpacity={0.20 + 0.55 * intensity} />
        </pattern>

        <pattern id="calico" width="70" height="70" patternUnits="userSpaceOnUse">
          <path d="M10 55 C 20 30, 30 70, 50 44 C 62 28, 55 15, 44 10 C 26 3, 16 16, 10 24 Z" fill={calico1} fillOpacity={0.45 + 0.40 * intensity} />
          <path d="M52 60 C 60 50, 66 64, 68 44 C 70 22, 58 18, 50 20 C 40 24, 46 42, 52 60 Z" fill={calico2} fillOpacity={0.55 + 0.35 * intensity} />
        </pattern>

        <clipPath id="faceClip">
          <path d="M250 132 C 160 132, 120 206, 122 275 C 124 360, 186 420, 250 420 C 314 420, 376 360, 378 275 C 380 206, 340 132, 250 132 Z" />
        </clipPath>

        <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="10" stdDeviation="10" floodColor="#000000" floodOpacity="0.35" />
        </filter>
      </defs>

      {/* background */}
      <rect x="0" y="0" width="500" height="500" fill="url(#bg)" />
      {confettiDots.map((d, idx) => (
        <circle key={idx} cx={d.cx} cy={d.cy} r={d.r} fill={d.fill} opacity={0.9} />
      ))}

      <g transform={`translate(250 270) rotate(${tilt}) translate(-250 -270)`} filter="url(#softShadow)">
        {/* body */}
        <path
          d="M160 430 C 150 380, 170 320, 220 305 C 235 300, 265 300, 280 305 C 330 320, 350 380, 340 430 C 320 468, 180 468, 160 430 Z"
          fill={fur.base}
          stroke={stroke}
          strokeWidth={6}
          strokeLinejoin="round"
        />

        <path
          d="M205 430 C 205 390, 215 340, 250 336 C 285 340, 295 390, 295 430 C 275 446, 225 446, 205 430 Z"
          fill={fur.belly}
          stroke={stroke}
          strokeWidth={5}
          strokeLinejoin="round"
        />

        {/* tail */}
        <path
          d="M345 412 C 392 402, 410 360, 396 330 C 382 300, 340 296, 328 320 C 320 336, 338 352, 352 356"
          fill="none"
          stroke={fur.base}
          strokeWidth={22}
          strokeLinecap="round"
        />
        <path
          d="M345 412 C 392 402, 410 360, 396 330 C 382 300, 340 296, 328 320 C 320 336, 338 352, 352 356"
          fill="none"
          stroke={stroke}
          strokeWidth={6}
          strokeLinecap="round"
        />

        {/* head */}
        <g clipPath="url(#faceClip)">
          <path
            d="M250 132 C 160 132, 120 206, 122 275 C 124 360, 186 420, 250 420 C 314 420, 376 360, 378 275 C 380 206, 340 132, 250 132 Z"
            fill={fur.base}
          />

          {fur.pattern !== 'solid' && (
            <path
              d="M250 132 C 160 132, 120 206, 122 275 C 124 360, 186 420, 250 420 C 314 420, 376 360, 378 275 C 380 206, 340 132, 250 132 Z"
              fill={
                fur.pattern === 'tabby'
                  ? 'url(#tabby)'
                  : fur.pattern === 'tuxedo'
                    ? 'url(#tuxedo)'
                    : 'url(#calico)'
              }
              opacity={0.95}
            />
          )}

          <path
            d="M160 210 C 140 175, 150 146, 180 140 C 204 136, 220 160, 222 187"
            fill={fur.base}
            stroke={stroke}
            strokeWidth={6}
            strokeLinejoin="round"
          />
          <path
            d="M340 210 C 360 175, 350 146, 320 140 C 296 136, 280 160, 278 187"
            fill={fur.base}
            stroke={stroke}
            strokeWidth={6}
            strokeLinejoin="round"
          />

          <rect x="120" y="170" width="260" height="250" fill="url(#shine)" opacity={0.55} />
        </g>

        <path
          d="M250 132 C 160 132, 120 206, 122 275 C 124 360, 186 420, 250 420 C 314 420, 376 360, 378 275 C 380 206, 340 132, 250 132 Z"
          fill="none"
          stroke={stroke}
          strokeWidth={7}
          strokeLinejoin="round"
        />

        {/* cheeks / muzzle */}
        <path
          d="M170 290 C 205 266, 232 270, 250 288 C 268 270, 295 266, 330 290 C 312 330, 284 352, 250 352 C 216 352, 188 330, 170 290 Z"
          fill={fur.belly}
          stroke={stroke}
          strokeWidth={5}
          strokeLinejoin="round"
        />

        {/* eyes */}
        {([0, 1] as const).map((side) => {
          const x = side === 0 ? 198 : 302;
          const eyeId = side === 0 ? 'L' : 'R';
          return (
            <g key={eyeId}>
              <ellipse cx={x} cy={240} rx={eyeW / 2} ry={eyeH / 2} fill="#ffffff" stroke={stroke} strokeWidth={5} />
              <ellipse cx={x} cy={242} rx={eyeW * 0.28} ry={eyeH * 0.28} fill={eyes.iris} />
              <ellipse
                cx={x}
                cy={242}
                rx={eyes.shape === 'almond' ? 6 : 7}
                ry={eyes.shape === 'almond' ? 14 : 12}
                fill={eyes.pupil}
              />
              {eyes.sparkle && (
                <circle cx={x - 10} cy={232} r={4} fill="#ffffff" opacity={0.95} />
              )}

              {lid > 0 && (
                <path
                  d={`M ${x - eyeW / 2 - 2} 236 C ${x - 10} ${236 + 40 * lid}, ${x + 10} ${236 + 40 * lid}, ${x + eyeW / 2 + 2} 236`}
                  fill="none"
                  stroke={fur.base}
                  strokeWidth={Math.round(18 * lid)}
                  strokeLinecap="round"
                />
              )}
            </g>
          );
        })}

        {/* eyebrows */}
        {pose.mood === 'grumpy' && (
          <g stroke={stroke} strokeWidth={6} strokeLinecap="round">
            <path d="M176 206 C 196 198, 216 198, 236 206" />
            <path d="M264 206 C 284 198, 304 198, 324 206" />
          </g>
        )}
        {pose.mood === 'happy' && (
          <g stroke={stroke} strokeWidth={6} strokeLinecap="round" opacity={0.8}>
            <path d="M176 210 C 196 202, 216 202, 236 210" />
            <path d="M264 210 C 284 202, 304 202, 324 210" />
          </g>
        )}

        {/* nose */}
        <path
          d="M240 275 C 248 268, 252 268, 260 275 C 254 286, 246 286, 240 275 Z"
          fill={mixHex('#ff6b8a', fur.belly, 0.25)}
          stroke={stroke}
          strokeWidth={4}
          strokeLinejoin="round"
        />

        {/* mouth */}
        <g stroke={stroke} strokeWidth={5} strokeLinecap="round" fill="none">
          <path d={`M250 ${mouthY} C 244 ${mouthY + 8 + mouthSmile}, 234 ${mouthY + 12 + mouthSmile}, 224 ${mouthY + 8}`} />
          <path d={`M250 ${mouthY} C 256 ${mouthY + 8 + mouthSmile}, 266 ${mouthY + 12 + mouthSmile}, 276 ${mouthY + 8}`} />
        </g>

        {/* whiskers */}
        <g stroke={stroke} strokeWidth={4} strokeLinecap="round" opacity={0.85}>
          <path d="M150 285 C 180 275, 205 275, 230 281" />
          <path d="M150 305 C 180 300, 205 302, 230 308" />
          <path d="M350 285 C 320 275, 295 275, 270 281" />
          <path d="M350 305 C 320 300, 295 302, 270 308" />
        </g>

        {/* collar */}
        {accessories.collarEnabled && (
          <g>
            <path
              d="M175 352 C 210 382, 290 382, 325 352"
              fill="none"
              stroke={accessories.collar}
              strokeWidth={18}
              strokeLinecap="round"
            />
            <path
              d="M175 352 C 210 382, 290 382, 325 352"
              fill="none"
              stroke={stroke}
              strokeWidth={5}
              strokeLinecap="round"
              opacity={0.9}
            />

            {accessories.bowEnabled && (
              <g transform="translate(250 360)">
                <path d="M0 0 C -14 -6, -26 2, -28 14 C -24 22, -12 22, 0 14" fill={mixHex(accessories.collar, '#ffffff', 0.2)} stroke={stroke} strokeWidth={4} />
                <path d="M0 0 C 14 -6, 26 2, 28 14 C 24 22, 12 22, 0 14" fill={mixHex(accessories.collar, '#ffffff', 0.2)} stroke={stroke} strokeWidth={4} />
                <circle cx="0" cy="12" r="6" fill={accessories.collar} stroke={stroke} strokeWidth={4} />
              </g>
            )}

            {accessories.bellEnabled && (
              <g transform="translate(250 388)">
                <circle cx="0" cy="0" r="14" fill={mixHex('#ffd36e', '#ffb703', 0.3)} stroke={stroke} strokeWidth={5} />
                <path d="M -6 -2 C -2 2, 2 2, 6 -2" stroke={stroke} strokeWidth={4} strokeLinecap="round" fill="none" />
                <circle cx="0" cy="7" r="3" fill={stroke} />
              </g>
            )}
          </g>
        )}

        {/* glasses */}
        {accessories.glassesEnabled && (
          <g opacity={0.92}>
            <circle cx="198" cy="240" r="32" fill="none" stroke={stroke} strokeWidth={6} />
            <circle cx="302" cy="240" r="32" fill="none" stroke={stroke} strokeWidth={6} />
            <path d="M230 240 C 240 232, 260 232, 270 240" fill="none" stroke={stroke} strokeWidth={6} strokeLinecap="round" />
          </g>
        )}

        {/* hats */}
        {accessories.hat !== 'none' && (
          <g>
            {accessories.hat === 'party' && (
              <g transform="translate(250 138)">
                <path d="M0 -52 L -44 18 L 44 18 Z" fill={mixHex(theme.c, '#ffffff', 0.05)} stroke={stroke} strokeWidth={6} />
                <circle cx="0" cy="-56" r="10" fill={mixHex(theme.c, '#ffffff', 0.2)} stroke={stroke} strokeWidth={5} />
              </g>
            )}
            {accessories.hat === 'beanie' && (
              <g transform="translate(250 152)">
                <path
                  d="M-70 10 C -60 -44, -20 -64, 0 -64 C 20 -64, 60 -44, 70 10"
                  fill={mixHex(theme.b, theme.c, 0.35)}
                  stroke={stroke}
                  strokeWidth={6}
                  strokeLinejoin="round"
                />
                <path d="M-78 10 H78" stroke={mixHex('#ffffff', theme.c, 0.4)} strokeWidth={16} strokeLinecap="round" />
              </g>
            )}
          </g>
        )}
      </g>

      {/* name label */}
      <g>
        <rect x="70" y="440" width="360" height="44" rx="14" fill="rgba(0,0,0,0.28)" stroke="rgba(255,255,255,0.16)" />
        <text x="250" y="468" textAnchor="middle" fill="rgba(255,255,255,0.85)" fontSize="18" fontFamily="ui-sans-serif,system-ui" fontWeight="650">
          {preset.name || 'Unnamed kitten'}
        </text>
      </g>
    </svg>
  );
}
