# Tic-Tac-Toe

A modern, functional Tic-Tac-Toe web application built with vanilla web technologies and designed with a clean, minimalist aesthetic.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Project Structure](#project-structure)
- [How to Run](#how-to-run)
  - [Option 1: Using the Node.js Development Server](#option-1-using-the-nodejs-development-server)
  - [Option 2: Direct Browser Preview](#option-2-direct-browser-preview)
- [Technical Architecture](#technical-architecture)
  - [Design Pattern](#design-pattern)
  - [Artificial Intelligence](#artificial-intelligence)
  - [Audio Synthesis](#audio-synthesis)
- [Accessibility](#accessibility)
- [Browser Compatibility](#browser-compatibility)
- [License](#license)

---

## Overview

This project provides an interactive Tic-Tac-Toe game focusing on simplicity, responsiveness, and clean code architecture. It requires no external runtime dependencies or front-end frameworks, relying strictly on standard web APIs.

---

## Features

- Two Game Modes:
  - 2 Players: Turn-based local multiplayer mode.
  - vs Computer: Single-player mode powered by the Minimax algorithm.
- Minimalist Dark UI: Clean dark aesthetic with glassmorphic cards, typography powered by Plus Jakarta Sans, and subtle micro-interactions.
- Animated Vector Graphics: Sharp SVG rendering with stroke animation for both X and O marks.
- Dynamic Strike Line: Responsive vector overlay that draws directly across the winning trio regardless of screen dimensions.
- Built-in Audio Synthesis: Synthesizes sound effects directly using the Web Audio API without loading external media files. Includes an audio toggle.
- Score Tracking: Real-time counter for X wins, O wins, and ties, persisted across sessions via browser local storage.
- Full Keyboard Navigation: Accessible grid controls using arrow keys, Enter, and Spacebar.

---

## Project Structure

```text
Tic-Tac-Toe/
├── index.html        # Semantic HTML5 markup and structure
├── style.css         # Minimalist stylesheet, layout, and animations
├── script.js         # Core application logic, AI engine, and audio synthesis
├── server.js         # Zero-dependency local static development server
├── package.json      # Project metadata and run scripts
└── README.md         # Project documentation
```

---

## How to Run

### Option 1: Using the Node.js Development Server

Prerequisites: Node.js (v14 or later) installed on your system.

1. Open your terminal and navigate to the project directory:
   ```bash
   cd /path/to/Tic-Tac-Toe
   ```

2. Start the local server:
   ```bash
   npm run dev
   ```

3. The server will start on `http://localhost:3000` and automatically attempt to open the application in your default web browser.

Alternatively, you can run the server directly using Node:
```bash
node server.js
```

### Option 2: Direct Browser Preview

Because this application uses standard vanilla HTML, CSS, and JavaScript with no build steps, you can open it directly:

- On macOS:
  ```bash
  open index.html
  ```
- On Linux:
  ```bash
  xdg-open index.html
  ```
- On Windows:
  ```cmd
  start index.html
  ```
- Or double-click `index.html` directly from your file manager.

---

## Technical Architecture

The application source code in `script.js` is organized into distinct namespaces:

### Design Pattern

- `GameLogic`: Pure computational functions responsible for board evaluation, available move determination, and win condition checks.
- `GameState`: Central state store managing current board state, active turn, game status, mode, and score persistence.
- `GameView`: Encapsulates all DOM manipulation, SVG generation, visual status updates, and coordinate mapping for winning lines.
- `GameController`: Coordinates user inputs, keyboard events, AI turn sequencing, and application lifecycle.

### Artificial Intelligence

The single-player mode uses the Minimax decision algorithm to compute the mathematically optimal move at any game state. A short artificial delay (360ms) is applied to simulate human thinking time and maintain fluid pacing.

### Audio Synthesis

The `SoundFX` module generates sounds programmatically using the browser's native `AudioContext`:
- Moves: Short sine wave chirps with tailored frequencies for X and O.
- Victory: Ascending major triad chord using triangle oscillators.
- Tie: Subtle descending two-tone envelope.
- Reset: Quick double-pitch acoustic tick.

---

## Accessibility

- The board uses standard WAI-ARIA roles (`role="grid"` and `role="gridcell"`).
- Current turn and results are broadcast to assistive technologies via `aria-live="polite"`.
- Keyboard navigation is fully supported across all 9 cells:
  - Arrow Keys: Move focus between adjacent cells.
  - Enter / Space: Commit move on the focused cell.
  - Clear `:focus-visible` outlines ensure keyboard visibility.

---

## Browser Compatibility

Compatible with all modern browsers supporting ECMAScript 6, CSS Grid, and the Web Audio API, including:
- Google Chrome
- Mozilla Firefox
- Apple Safari
- Microsoft Edge

---

## License

This project is licensed under the MIT License.
