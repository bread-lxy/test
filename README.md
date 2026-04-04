# The Emotionally Unstable Button

A premium-looking, deliberately chaotic single-page React experience where a glossy red button refuses to be clicked, then has a full emotional collapse when the player finally succeeds.

Live concept:
- Phase 1 starts in a quiet minimalist white room with a giant red `DO NOT CLICK` button.
- The button dodges the cursor whenever it gets too close, making the click feel mischievously unfair.
- After the click, the experience flips into a neon-pink breakdown full of glowing cyber tears, a tissue cursor, and an empathy mini-game.
- If the player wipes enough tears, the app reaches a redemption state. If they fail, the interface spirals into a full empathy apocalypse.

## Features

- Evasive hero button with proximity-based teleporting
- Smooth animated transitions powered by Framer Motion
- Highly styled single-page UI using React and Tailwind CSS
- Falling, bouncing, wipeable tear particles
- Tissue cursor interaction after the emotional breakdown begins
- Clear in-game objective, progress tracking, and fail state
- Redemption ending that rewards successful cleanup

## Tech Stack

- React
- Vite
- Tailwind CSS
- Framer Motion

## Gameplay Flow

### Phase 1: The Minimalist Tease

The page opens with a stark white aesthetic and a glossy red central button labeled `DO NOT CLICK`.

As the pointer approaches within the danger radius, the button jumps to a new position in the viewport. It stays barely possible to click, but only if the player gets lucky or moves carefully.

### Phase 2: The Emotional Breakdown

Clicking the button triggers a dramatic mood swing:

- The background snaps into hot pink chaos
- The button shakes and accuses the user
- Blue tear particles begin to spill out
- The cursor transforms into a tissue
- A tutorial card explains the new objective

The player must wipe tears by moving the tissue cursor over them.

### Phase 3: Outcome

There are now two possible endings:

- Redemption: wipe enough tears to calm the button down
- Collapse: let too many tears accumulate and the screen floods with `YOU LACK EMPATHY!!!`

## Getting Started

### Prerequisites

- Node.js 18 or newer
- npm

### Install

```bash
npm install
```

### Run in Development

```bash
npm run dev
```

Then open the local URL shown by Vite, usually:

```text
http://localhost:5173
```

Important:

This is a Vite app. Do not open `index.html` directly from the filesystem or the app may appear blank. Run it through the Vite dev server instead.

### Production Build

```bash
npm run build
```

### Preview the Production Build

```bash
npm run preview
```

## Project Structure

```text
.
+-- src/
|   +-- App.jsx
|   +-- index.css
|   `-- main.jsx
+-- index.html
+-- package.json
`-- vite.config.js
```

## Scripts

- `npm run dev` starts the local Vite development server
- `npm run build` creates the production bundle in `dist/`
- `npm run preview` previews the production build locally

## Design Notes

The app is intentionally built around contrast:

- stillness versus overload
- premium gloss versus ridiculous emotional instability
- playful guilt mechanic versus arcade-style cleanup challenge

The first screen is calm and restrained, while the post-click state becomes loud, bright, and absurd without losing interaction clarity.

## Future Ideas

- Add sound design for button dodges, tear wipes, and failure states
- Introduce score streaks and combo-based wiping feedback
- Add multiple tear behaviors such as splitting or homing droplets
- Support touch-specific controls for mobile play

## License

This project is provided for personal learning and experimentation unless you choose to add a different license.
