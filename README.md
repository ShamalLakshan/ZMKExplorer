# ZMK Keymap & Physical Layout Explorer

A modern, cozy, tactile web visualizer, inspector, quiz trainer, and combo analyzer for **ZMK keyboard keymaps** (`.keymap`) and **physical layouts** (`.json`).

Built with **React 19**, **TypeScript**, **Vite 6**, and **Web Audio API**.

---

## ✨ Features

### 1. ⌨️ True Physical Layout Geometry (`.json`)
- **Direct JSON Upload**: Upload any keyboard layout JSON (including `bgkeeb.json`, ZMK physical layouts, Keyboard Layout Editor (KLE) JSON, or VIA formats).
- **Exact Coordinates**: Renders keys at exact `x`, `y`, `w`, `h`, and rotation angle `r`.
- **Rotary Encoders**: Visualizes rotary encoders with metal knob styling, center indicators, and live sensor bindings (e.g. `Vol+ / Vol-`, `Next / Prev`).
- **Heuristic Layout Fallbacks**: If no JSON layout is loaded, automatically renders ergonomic split layouts (34, 36, 38, 42, 58 keys with column stagger and angled thumb clusters) or ortholinear grids.

### 2. 📑 Advanced ZMK Keymap Parser (`.keymap`)
- Parses Devicetree `.keymap` and `.dtsi` syntax.
- Resolves `#define` macros and layer references.
- Decodes home-row mods (`&hml`, `&hmr`, `&mt`), layer taps (`&lt`), momentary layers (`&mo`, `&to`, `&tog`, `&sl`), sticky keys (`&sk`), mouse keys (`&mmv`, `&mkp`, `&msc`), Bluetooth (`&bt`), outputs (`&out`), and system keys (`&bootloader`, `&sys_reset`, `&caps_word`).
- **Transparent Keys (`&trans`)**: Shows a subtle dashed boundary with the underlying base-layer key transparently visible beneath it.
- **Held Activators**: When viewing a non-base layer, the exact key on the base layer that activates it pulses with a cozy glow and a `HELD` badge.

### 3. ⚡ Combo Chords Visualization
- **Interactive Connecting Chords**: Hovering or clicking any combo draws smooth SVG bezier curves connecting all keys in the chord.
- **Centroid Output Badges**: Displays a floating badge over the centroid of the combo keys showing the triggered output (e.g., `&kp ESC` between Q and E).
- **"Show All Chords" Mode**: Toggle to view all combo connections on the board simultaneously.
- **Layer-Filtered Combos**: Filter combos to only show those active on the current layer.

### 4. 🔀 Layer Map & Conditional Layers (Tri-Layers)
- Interactive **Layer Map** showing all layer connections.
- **Conditional Layer Visualization**: Inspect `conditional_layers` rules (e.g. holding `CODE` + `NAV` triggers `FUNC`).

### 5. 🎯 Gamified Muscle Memory Quiz Mode
- **Test Muscle Memory**: Prompts you to find symbols, brackets, numbers, media keys, or navigation keys.
- **Blind Mode**: Masks keycap legends so you must find keys using spatial memory.
- **Category Filter**: Practice specific subsets (Symbols & Punctuation, Navigation & Arrows, Media & System, Alpha).
- **Interactive Layer Navigation**: Switch layers by clicking your layer keys or pressing numbers `1`–`9` during the quiz.
- **Streaks & Confetti**: Tracks streaks, accuracy percentage, personal best, and celebrates milestone streaks with celebratory confetti.

### 6. 🎨 Pywal-like Color Extraction & Cozy Aesthetics
- **Wallpaper URL & Upload**: Paste any background image URL (Unsplash, anime, lofi, deskmat photos) or upload a local image file.
- **In-Browser Pywal Color Extraction**: An in-browser k-means algorithm quantizes the image pixels, extracts dominant dark/light tones and vibrant accents, and creates a matching color palette.
- **Cozy Typography**: Non-AI typography pairing **Plus Jakarta Sans** for UI and **JetBrains Mono** for key legends.
- **Tactile Keycaps**: Realistic mechanical keyboard drop shadows, subtle border radius, and active press-down feel.
- **Curated Theme Palettes**: Cozy Dark, Cozy Latte, Nord Forest, Gruvbox Warm, Catppuccin Mocha, Tokyo Night, and Rosé Pine.
- **Wallpaper Controls**: Sliders for Background Blur (0–25px) and Darken Overlay (0–90%).

### 7. 🔊 Web Audio Mechanical Switch Synthesizer
- Built-in zero-asset audio synthesizer using the Web Audio API.
- Generates realistic tactile mechanical keyboard switch clicks, layer switch swooshes, and quiz victory chimes.
- Toggle sound on/off with one click.

### 8. 💾 Persistent LocalStorage
- Saves your uploaded `.keymap`, `.json` layout, selected theme, wallpaper, layout preferences, and quiz high scores across browser restarts.

---

## 🚀 Quick Start

### Development
```bash
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

### Production Build
```bash
npm run build
npm run preview
```
The optimized production bundle is generated in `dist/`.

---

## 🌐 Deploy to GitHub Pages (`<username>.github.io/<repo>`)

This project includes a ready-to-run GitHub Actions workflow in [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml).

### Steps to Deploy:
1. **Enable GitHub Actions for Pages**:
   - Go to your repository on GitHub: `Settings` → `Pages`.
   - Under **Build and deployment** → **Source**, select **`GitHub Actions`**.
2. **Push your code**:
   ```bash
   git add .
   git commit -m "Deploy ZMK Explorer"
   git remote add origin https://github.com/<your-username>/<repo-name>.git
   git push -u origin main
   ```
3. **Automatic Deployment**:
   - The workflow will build and publish your site automatically.
   - Your site will be live at:
     ```
     https://<your-username>.github.io/<repo-name>/
     ```

---

## 📁 Reference Files Included
- [`bgkeeb.json`](./bgkeeb.json): 36-key + 2 encoder physical layout with exact millimeter coordinates.
- [`bgkeeb.keymap`](./bgkeeb.keymap): Swweeep 36-key + 2 encoders keymap with combos, conditional layers, and sensor bindings.
- [`zmk-keymap-explorer.html`](./zmk-keymap-explorer.html): Original single-file HTML prototype for historical reference.
