# ZMK Explorer

A web-based visualizer, inspector, quiz trainer, and image exporter for ZMK keyboard keymaps (`.keymap`) and physical layouts (`.json`).

![ZMK Explorer](screenshots/Screenshot%202026-11-24%20at%2020-54-52%20ZMK%20Keymap%20%26%20Layout%20Explorer.png)

## What It Can Do

- **Keymap Parsing**: Parses ZMK devicetree files (`.keymap`, `.dtsi`), decoding behaviors such as home-row mods, layer taps, momentary toggles, sticky keys, transparent keys, and sensor bindings.
- **Physical Layout Geometry**: Renders exact key positions and rotations from layout JSON (`info.json`, KLE, VIA), with automatic fallback geometries for split and ortholinear boards.
- **Simultaneous Dual Import**: Import both `.keymap` and `.json` layout files at once via drag-and-drop or file picker.
- **Rotary Encoders**: Visualizes rotary encoder knobs and displays layer-specific clockwise/counter-clockwise bindings.
- **Combo Visualization**: Displays combo chord connections with curved SVG lines and centroid output badges, with an option to view all chords at once.
- **Layer Map & Tri-Layers**: Inspects layer hierarchies and conditional tri-layer triggers.
- **Muscle Memory Quiz**: Practice key recall across layers with a gamified quiz trainer and blind mode.
- **Image & Wallpaper Export**: Exports high-resolution transparent layout PNGs and desktop wallpapers (1080p, 1440p, 4K, 16:10) with multi-layer grid layouts and custom artwork.
- **Themes & Sound**: Multiple color presets, wallpaper color extraction, and synthesized mechanical switch audio feedback via Web Audio API.

<details>
<summary>Additional Screenshots</summary>

| Wallpaper Export | Layer Flow & Tri-Layers | Dual Source Import |
| :---: | :---: | :---: |
| <img src="screenshots/Screenshot 2026-11-24 at 20-55-27 ZMK Keymap & Layout Explorer.png" width="280" /> | <img src="screenshots/Screenshot 2026-11-24 at 20-55-46 ZMK Keymap & Layout Explorer.png" width="280" /> | <img src="screenshots/Screenshot 2026-11-24 at 20-56-19 ZMK Keymap & Layout Explorer.png" width="280" /> |

</details>

## Getting Started

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
npm run preview
```
