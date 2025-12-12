import React from 'react';
import { KittenCustomizer } from './kitten/KittenCustomizer';

export function App() {
  return (
    <div className="container">
      <div className="header">
        <div className="title">
          <h1>Kitten Customizer</h1>
          <p>Build a kitten safely in SVG. Share presets, export SVG, randomize.</p>
        </div>
      </div>

      <KittenCustomizer />
    </div>
  );
}
