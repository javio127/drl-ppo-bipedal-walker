# Bipedal Walker Interactive Art Project – Reference Doc

## Overview

This project is a web-based interactive art experience where users watch a reinforcement learning (RL) agent learn to walk in real time. It uses a pre-trained PPO model for a 2D bipedal walker, rendered with Three.js and run in-browser with TensorFlow.js.

---

## Table of Contents

1. [Project Goals](#project-goals)
2. [User Journey](#user-journey)
3. [Tech Stack](#tech-stack)
4. [App Structure](#app-structure)
5. [Pages & Components](#pages--components)
6. [Model Details](#model-details)
7. [Renderer Details](#renderer-details)
8. [Live Telemetry & Visual Cues](#live-telemetry--visual-cues)
9. [How to Use the Model in the Web App](#how-to-use-the-model-in-the-web-app)
10. [API (Optional)](#api-optional)
11. [Deployment](#deployment)
12. [Extensibility & Bonus Features](#extensibility--bonus-features)
13. [References](#references)

---

## Project Goals

- Let users visually experience a 2D RL agent learning to walk—in-browser, with smooth animation and light interactivity.
- Make the learning process transparent and engaging via live telemetry and visual cues.

---

## User Journey

1. **Landing Page**
   - User arrives at the homepage and sees the hero text: "Watch a machine learn to walk."
   - User can browse a carousel of prompts (e.g., "Show me a clumsy start", "Watch it stumble then improve").
   - User clicks the "Run Simulation" button.

2. **Simulation Page**
   - The app loads the pre-trained bipedal walker model (with a loading screen).
   - The walker appears on a 2D canvas, animated in real time.
   - User sees live telemetry: reward, steps, time elapsed, etc.
   - User can interact: restart the simulation, change terrain, or select a starting pose.
   - User observes the agent's performance, with visual cues indicating learning and improvement.
   - Optionally, user can replay previous runs or switch to different terrains.

3. **(Optional) Replay/Learning Mode**
   - User can view earlier, clumsier attempts and compare them to the current run.
   - User can toggle sound effects or visual enhancements.

---

## Tech Stack

| Layer      | Tech                        |
|------------|-----------------------------|
| Frontend   | React + Three.js            |
| ML Inference | TensorFlow.js             |
| Hosting    | Vercel                      |
| Backend (optional) | Node.js + Express   |
| Charting   | Chart.js or Recharts        |

---

## App Structure

```
/public
  /model
    model.json
    (other model files)
  /images
/src
  /components
    LandingPage.jsx
    SimulationPage.jsx
    WalkerRenderer.jsx
    Controls.jsx
    TelemetryPanel.jsx
    RewardGraph.jsx
  /utils
    modelUtils.js
    terrainUtils.js
  App.jsx
  index.js
```

---

## Pages & Components

### Landing Page (`/`)
- **Hero text:** "Watch a machine learn to walk"
- **CTA:** Run Simulation button
- **Prompt carousel:** Static suggestions like "Show me a clumsy start", "Watch it stumble then improve"

### Simulation Page (`/simulate`)
- **WalkerRenderer:** Uses Three.js to draw the walker (circles/lines for joints/limbs)
- **Model Loading:** Loads `/model/model.json` with TensorFlow.js
- **Simulation Loop:** 
  - At each frame, get the current state (joint positions/velocities)
  - Call `model.predict(inputTensor)` to get joint torques
  - Update the walker's state and re-render
- **Display:**
  - Time elapsed
  - Reward score
  - Steps taken
- **Controls:**
  - Restart
  - Change terrain (basic selector)
  - Change starting pose (dropdown)
- **TelemetryPanel:** Shows live stats (reward, steps, time, etc.)
- **RewardGraph:** Live-updating graph of reward over time

---

## Model Details

- **Type:** 2D Bipedal Walker (PPO-trained)
- **Inputs:** Joint positions, velocities
- **Output:** Joint torques
- **Reward:** Forward movement + stability
- **File:** `/public/model/model.json`
- **Inference Example:**
  ```js
  const model = await tf.loadLayersModel('/model/model.json');
  const input = tf.tensor([normalizedState]);
  const output = model.predict(input);
  // Normalize inputs before passing; reverse-normalize outputs after.
  ```

---

## Renderer Details

- **Library:** Three.js
- **Walker:** Drawn as circles (joints) and lines (limbs)
- **Animation:** Real-time, updated from model predictions
- **Terrain:** Switchable (flat, hilly, etc.)

---

## Live Telemetry & Visual Cues

- **Live Reward Display:** Number, progress bar, or graph
- **Telemetry Panel:** Steps, time, episode, reward, speed, stability
- **Reward Over Time Graph:** Line chart, moving average
- **Visual Cues:** Color changes, particle effects, walker "expressions"
- **Learning Mode:** Replay early runs, show improvement

---

## How to Use the Model in the Web App

### 1. Export/Convert Your Model to TensorFlow.js Format
- If your model is in PyTorch or TensorFlow (Python), use the TensorFlow.js converter:
  - For TensorFlow: `tensorflowjs_converter --input_format=tf_saved_model /path/to/saved_model /path/to/web_model`
  - For PyTorch: Export to ONNX, then convert to TensorFlow, then to TensorFlow.js.
- Place the resulting `model.json` and weight files in `/public/model/`.

### 2. Load the Model in the App
```js
import * as tf from '@tensorflow/tfjs';

const model = await tf.loadLayersModel('/model/model.json');
```

### 3. Prepare and Normalize Input
- The model expects normalized state vectors (joint positions, velocities, etc.).
- Normalize inputs in the same way as during training (e.g., min-max or z-score normalization).

### 4. Run Inference
```js
const input = tf.tensor([normalizedState]);
const output = model.predict(input);
const action = output.dataSync(); // joint torques
```
- Reverse-normalize outputs if needed.

### 5. Update Simulation
- Apply the predicted torques to your walker simulation.
- Update the state and re-render the walker in Three.js.

### 6. Show Live Telemetry
- Update reward, steps, and other stats in real time as the simulation runs.

### 7. Troubleshooting
- Ensure the model input/output shapes match your simulation.
- Check normalization consistency between training and inference.
- Use browser console for debugging TensorFlow.js errors.

---

## API (Optional)

If you want to run the model server-side:

- **POST /api/run-model**
  - **Body:** `{ state }`
  - **Returns:** `{ next_state, action }`

---

## Deployment

- **Platform:** Vercel (CI/CD)
- **Optimization:** Tree-shake Three.js and TensorFlow.js
- **Loading Screen:** While model initializes

---

## Extensibility & Bonus Features

- Terrain switcher (flat, hilly)
- Replay mode
- Learning mode (show early stumbles)
- Walking sound effects

---

## References

- [PPO Paper](https://arxiv.org/pdf/1707.06347.pdf)
- [OpenAI BipedalWalker](https://gym.openai.com/envs/BipedalWalker-v2/)
- [TensorFlow.js Docs](https://www.tensorflow.org/js)
- [Three.js Docs](https://threejs.org/docs/)
- [Vercel](https://vercel.com/)
- [Original PPO BipedalWalker Repo](link-to-your-repo) 