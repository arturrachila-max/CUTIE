import React, { useEffect, useMemo, useRef, useState } from 'react';
import { defaultPreset, type KittenPreset, clamp, clamp01 } from '../lib/kittenSchema';
import { decodePresetFromUrlParam, encodePresetToUrlParam } from '../lib/presetCodec';
import { KittenRenderer } from './KittenRenderer';

function randomColor(seed: number): string {
  // deterministic-ish bright-ish colors
  const r = Math.floor(80 + (Math.abs(Math.sin(seed * 1.7)) * 175));
  const g = Math.floor(80 + (Math.abs(Math.sin(seed * 2.1)) * 175));
  const b = Math.floor(80 + (Math.abs(Math.sin(seed * 2.9)) * 175));
  const hex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${hex(r)}${hex(g)}${hex(b)}`;
}

function downloadTextFile(filename: string, mime: string, content: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function sanitizeName(name: string): string {
  return name
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 40)
    .replace(/[^a-zA-Z0-9 _\-'.]/g, '');
}

function presetToSvgString(svg: SVGSVGElement): string {
  // Serialize the existing DOM node. No untrusted HTML insertion.
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
  const xml = new XMLSerializer().serializeToString(clone);
  return `<?xml version="1.0" encoding="UTF-8"?>\n${xml}`;
}

export function KittenCustomizer() {
  const [preset, setPreset] = useState<KittenPreset>(() => defaultPreset());
  const [toast, setToast] = useState<string>('');
  const svgHostRef = useRef<HTMLDivElement | null>(null);

  // Load preset from URL param (untrusted) on mount.
  useEffect(() => {
    const url = new URL(window.location.href);
    const param = url.searchParams.get('preset');
    if (!param) return;

    const decoded = decodePresetFromUrlParam(param);
    if (decoded) {
      setPreset(decoded);
      setToast('Loaded preset from URL.');
    } else {
      setToast('Preset in URL was invalid and was ignored.');
    }
  }, []);

  const shareUrl = useMemo(() => {
    const url = new URL(window.location.href);
    url.searchParams.set('preset', encodePresetToUrlParam(preset));
    return url.toString();
  }, [preset]);

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setToast('Copied to clipboard.');
    } catch {
      setToast('Copy failed (browser permissions).');
    }
  }

  function randomize() {
    const s = Date.now() / 1000;
    setPreset((p) => ({
      ...p,
      name: sanitizeName(p.name) || 'Kitten',
      fur: {
        ...p.fur,
        base: randomColor(s * 1.1),
        belly: randomColor(s * 1.7),
        outline: '#111827',
        pattern: (['solid', 'tabby', 'tuxedo', 'calico'] as const)[Math.floor((Math.abs(Math.sin(s)) * 100) % 4)]!,
        patternIntensity: clamp01(Math.abs(Math.sin(s * 1.23))),
      },
      eyes: {
        ...p.eyes,
        iris: randomColor(s * 2.3),
        pupil: '#0b0f1a',
        shape: Math.abs(Math.cos(s)) > 0.5 ? 'almond' : 'round',
        sparkle: Math.abs(Math.sin(s * 0.37)) > 0.3,
      },
      accessories: {
        ...p.accessories,
        collarEnabled: Math.abs(Math.sin(s * 0.5)) > 0.2,
        collar: randomColor(s * 3.3),
        bellEnabled: Math.abs(Math.sin(s * 0.8)) > 0.2,
        bowEnabled: Math.abs(Math.cos(s * 0.8)) > 0.4,
        glassesEnabled: Math.abs(Math.sin(s * 0.91)) > 0.5,
        hat: (['none', 'party', 'beanie'] as const)[Math.floor((Math.abs(Math.cos(s * 0.77)) * 100) % 3)]!,
      },
      pose: {
        mood: (['happy', 'curious', 'sleepy', 'grumpy'] as const)[Math.floor((Math.abs(Math.sin(s * 0.66)) * 100) % 4)]!,
        tilt: clamp(Math.round((Math.sin(s) * 12) * 10) / 10, -20, 20),
      },
      background: {
        theme: (['midnight', 'sunrise', 'mint', 'candy'] as const)[Math.floor((Math.abs(Math.cos(s * 0.39)) * 100) % 4)]!,
        confetti: Math.abs(Math.sin(s * 0.42)) > 0.55,
      },
    }));
    setToast('Randomized kitten.');
  }

  function reset() {
    setPreset(defaultPreset());
    setToast('Reset to default kitten.');
  }

  function downloadSvg() {
    const svg = svgHostRef.current?.querySelector('svg');
    if (!svg) {
      setToast('Could not find SVG element.');
      return;
    }
    const xml = presetToSvgString(svg);
    downloadTextFile(`${sanitizeName(preset.name || 'kitten') || 'kitten'}.svg`, 'image/svg+xml;charset=utf-8', xml);
    setToast('Downloaded SVG.');
  }

  return (
    <div className="grid">
      <div className="panel">
        <div className="panelHeader">
          <h2>Preview</h2>
          <div className="actions">
            <button className="primary" onClick={randomize} type="button">Randomize</button>
            <button onClick={reset} type="button">Reset</button>
            <button onClick={downloadSvg} type="button">Download SVG</button>
          </div>
        </div>
        <div className="kitStage">
          <div className="kitStageInner" ref={svgHostRef}>
            <div className="badge">SVG • No images • Safe text rendering</div>
            <KittenRenderer preset={preset} />
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panelHeader">
          <h2>Customize</h2>
          <div className="actions">
            <button onClick={() => copyToClipboard(shareUrl)} type="button">Copy Share URL</button>
          </div>
        </div>
        <div className="panelBody">
          <div className="controls">
            {toast ? <div className="toast">{toast}</div> : null}

            <div className="group">
              <div className="groupTitle">Identity</div>
              <div className="row">
                <div className="field">
                  <label>Kitten name</label>
                  <input
                    type="text"
                    value={preset.name}
                    onChange={(e) => setPreset((p) => ({ ...p, name: sanitizeName(e.target.value) }))}
                    placeholder="Mochi"
                    inputMode="text"
                    autoComplete="off"
                  />
                  <div className="smallNote">Max 40 chars, safe charset (no HTML).</div>
                </div>
                <div className="field">
                  <label>Mood</label>
                  <select
                    value={preset.pose.mood}
                    onChange={(e) =>
                      setPreset((p) => ({
                        ...p,
                        pose: { ...p.pose, mood: e.target.value as KittenPreset['pose']['mood'] },
                      }))
                    }
                  >
                    <option value="happy">Happy</option>
                    <option value="curious">Curious</option>
                    <option value="sleepy">Sleepy</option>
                    <option value="grumpy">Grumpy</option>
                  </select>
                </div>
              </div>
              <div className="row">
                <div className="field">
                  <label>Head tilt ({preset.pose.tilt.toFixed(1)}°)</label>
                  <input
                    type="range"
                    min={-20}
                    max={20}
                    step={0.5}
                    value={preset.pose.tilt}
                    onChange={(e) =>
                      setPreset((p) => ({
                        ...p,
                        pose: { ...p.pose, tilt: clamp(Number(e.target.value), -20, 20) },
                      }))
                    }
                  />
                </div>
              </div>
            </div>

            <div className="group">
              <div className="groupTitle">Fur</div>
              <div className="row">
                <div className="field">
                  <label>Base</label>
                  <input
                    type="color"
                    value={preset.fur.base}
                    onChange={(e) => setPreset((p) => ({ ...p, fur: { ...p.fur, base: e.target.value } }))}
                  />
                </div>
                <div className="field">
                  <label>Belly</label>
                  <input
                    type="color"
                    value={preset.fur.belly}
                    onChange={(e) => setPreset((p) => ({ ...p, fur: { ...p.fur, belly: e.target.value } }))}
                  />
                </div>
              </div>
              <div className="row">
                <div className="field">
                  <label>Outline</label>
                  <input
                    type="color"
                    value={preset.fur.outline}
                    onChange={(e) => setPreset((p) => ({ ...p, fur: { ...p.fur, outline: e.target.value } }))}
                  />
                </div>
                <div className="field">
                  <label>Pattern</label>
                  <select
                    value={preset.fur.pattern}
                    onChange={(e) =>
                      setPreset((p) => ({
                        ...p,
                        fur: { ...p.fur, pattern: e.target.value as KittenPreset['fur']['pattern'] },
                      }))
                    }
                  >
                    <option value="solid">Solid</option>
                    <option value="tabby">Tabby</option>
                    <option value="tuxedo">Tuxedo</option>
                    <option value="calico">Calico</option>
                  </select>
                </div>
              </div>
              <div className="row">
                <div className="field">
                  <label>Pattern intensity ({Math.round(preset.fur.patternIntensity * 100)}%)</label>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={preset.fur.patternIntensity}
                    onChange={(e) =>
                      setPreset((p) => ({
                        ...p,
                        fur: { ...p.fur, patternIntensity: clamp01(Number(e.target.value)) },
                      }))
                    }
                  />
                </div>
              </div>
            </div>

            <div className="group">
              <div className="groupTitle">Eyes</div>
              <div className="row">
                <div className="field">
                  <label>Iris</label>
                  <input
                    type="color"
                    value={preset.eyes.iris}
                    onChange={(e) => setPreset((p) => ({ ...p, eyes: { ...p.eyes, iris: e.target.value } }))}
                  />
                </div>
                <div className="field">
                  <label>Pupil</label>
                  <input
                    type="color"
                    value={preset.eyes.pupil}
                    onChange={(e) => setPreset((p) => ({ ...p, eyes: { ...p.eyes, pupil: e.target.value } }))}
                  />
                </div>
              </div>
              <div className="row">
                <div className="field">
                  <label>Shape</label>
                  <select
                    value={preset.eyes.shape}
                    onChange={(e) =>
                      setPreset((p) => ({
                        ...p,
                        eyes: { ...p.eyes, shape: e.target.value as KittenPreset['eyes']['shape'] },
                      }))
                    }
                  >
                    <option value="round">Round</option>
                    <option value="almond">Almond</option>
                  </select>
                </div>
                <div className="field">
                  <label>Sparkle</label>
                  <div className="toggle">
                    <input
                      type="checkbox"
                      checked={preset.eyes.sparkle}
                      onChange={(e) => setPreset((p) => ({ ...p, eyes: { ...p.eyes, sparkle: e.target.checked } }))}
                    />
                    <div className="smallNote">Adds a tiny highlight.</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="group">
              <div className="groupTitle">Accessories</div>
              <div className="row">
                <div className="field">
                  <label>Collar</label>
                  <div className="toggle">
                    <input
                      type="checkbox"
                      checked={preset.accessories.collarEnabled}
                      onChange={(e) =>
                        setPreset((p) => ({
                          ...p,
                          accessories: { ...p.accessories, collarEnabled: e.target.checked },
                        }))
                      }
                    />
                    <div className="smallNote">Enable collar</div>
                  </div>
                </div>
                <div className="field">
                  <label>Collar color</label>
                  <input
                    type="color"
                    value={preset.accessories.collar}
                    onChange={(e) =>
                      setPreset((p) => ({
                        ...p,
                        accessories: { ...p.accessories, collar: e.target.value },
                      }))
                    }
                    disabled={!preset.accessories.collarEnabled}
                  />
                </div>
              </div>
              <div className="row">
                <div className="field">
                  <label>Bell</label>
                  <div className="toggle">
                    <input
                      type="checkbox"
                      checked={preset.accessories.bellEnabled}
                      onChange={(e) =>
                        setPreset((p) => ({
                          ...p,
                          accessories: { ...p.accessories, bellEnabled: e.target.checked },
                        }))
                      }
                      disabled={!preset.accessories.collarEnabled}
                    />
                    <div className="smallNote">Needs collar</div>
                  </div>
                </div>
                <div className="field">
                  <label>Bow</label>
                  <div className="toggle">
                    <input
                      type="checkbox"
                      checked={preset.accessories.bowEnabled}
                      onChange={(e) =>
                        setPreset((p) => ({
                          ...p,
                          accessories: { ...p.accessories, bowEnabled: e.target.checked },
                        }))
                      }
                      disabled={!preset.accessories.collarEnabled}
                    />
                    <div className="smallNote">Needs collar</div>
                  </div>
                </div>
              </div>
              <div className="row">
                <div className="field">
                  <label>Glasses</label>
                  <div className="toggle">
                    <input
                      type="checkbox"
                      checked={preset.accessories.glassesEnabled}
                      onChange={(e) =>
                        setPreset((p) => ({
                          ...p,
                          accessories: { ...p.accessories, glassesEnabled: e.target.checked },
                        }))
                      }
                    />
                    <div className="smallNote">Two circles + bridge</div>
                  </div>
                </div>
                <div className="field">
                  <label>Hat</label>
                  <select
                    value={preset.accessories.hat}
                    onChange={(e) =>
                      setPreset((p) => ({
                        ...p,
                        accessories: { ...p.accessories, hat: e.target.value as KittenPreset['accessories']['hat'] },
                      }))
                    }
                  >
                    <option value="none">None</option>
                    <option value="party">Party hat</option>
                    <option value="beanie">Beanie</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="group">
              <div className="groupTitle">Background</div>
              <div className="row">
                <div className="field">
                  <label>Theme</label>
                  <select
                    value={preset.background.theme}
                    onChange={(e) =>
                      setPreset((p) => ({
                        ...p,
                        background: { ...p.background, theme: e.target.value as KittenPreset['background']['theme'] },
                      }))
                    }
                  >
                    <option value="midnight">Midnight</option>
                    <option value="sunrise">Sunrise</option>
                    <option value="mint">Mint</option>
                    <option value="candy">Candy</option>
                  </select>
                </div>
                <div className="field">
                  <label>Confetti</label>
                  <div className="toggle">
                    <input
                      type="checkbox"
                      checked={preset.background.confetti}
                      onChange={(e) =>
                        setPreset((p) => ({
                          ...p,
                          background: { ...p.background, confetti: e.target.checked },
                        }))
                      }
                    />
                    <div className="smallNote">Decorative dots</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="group">
              <div className="groupTitle">Advanced</div>
              <div className="actions">
                <button onClick={() => copyToClipboard(JSON.stringify(preset, null, 2))} type="button">
                  Copy preset JSON
                </button>
                <button
                  className="danger"
                  onClick={() => {
                    const url = new URL(window.location.href);
                    url.searchParams.delete('preset');
                    window.history.replaceState({}, '', url.toString());
                    setToast('Removed preset from URL (not saved).');
                  }}
                  type="button"
                >
                  Remove preset from URL
                </button>
              </div>
              <div className="smallNote">
                This is a standalone/static build: the URL preset is treated as untrusted input and is validated with
                Zod before use.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
