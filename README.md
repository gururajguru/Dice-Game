# 🎲 Dice Duel — 2-Player Dice Game

A **premium, fully-featured 2-player turn-based dice game** built with Python/Flask backend and a modern HTML/CSS/Vanilla JS frontend.

---

## 🎮 Game Rules

| Rule | Detail |
|------|--------|
| Players | 2 |
| Starting Score | 0 each |
| Winning Score | **30 points** |
| Roll 1 or 6 | ✨ **Extra throw granted** |
| Roll 2, 3, 4, or 5 | Turn passes to the other player |
| Win Condition | First player to reach ≥ 30 points wins immediately |

---

## 🏗️ Project Structure

```
dice-game/
├── app.py               ← Flask API routes (thin layer)
├── game.py              ← Core game logic & state engine
├── requirements.txt     ← Python dependencies
├── README.md            ← This file
│
├── templates/
│   └── index.html       ← Jinja2 HTML template
│
└── static/
    ├── css/
    │   └── style.css    ← Premium dark-space themed CSS
    ├── js/
    │   └── script.js    ← Frontend game logic (Vanilla JS)
    └── images/
        ├── dice-1.jpg   ← AI-generated dice face images
        ├── dice-2.jpg
        ├── dice-3.jpg
        ├── dice-4.jpg
        ├── dice-5.jpg
        └── dice-6.jpg
```

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd dice-game
pip install -r requirements.txt
```

### 2. Run the Server

```bash
python app.py
```

### 3. Open the Game

Navigate to: **http://127.0.0.1:5000**

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`  | `/`      | Serve the main game page |
| `GET`  | `/api/state` | Get current game state as JSON |
| `POST` | `/api/roll` | Roll the dice for the current player |
| `POST` | `/api/reset` | Reset the game (optionally with new player names) |

### Example: Reset with custom names
```json
POST /api/reset
{ "player_names": ["Alice", "Bob"] }
```

### Example: Roll response
```json
{
  "roll": 6,
  "event": "extra_throw",
  "players": [...],
  "current_player_id": 2,
  "extra_throw": true,
  "game_over": false,
  "winner_id": null
}
```

**Events:**
- `extra_throw` — rolled 1 or 6, same player rolls again
- `turn_end` — rolled 2–5, turn switches
- `win` — player has reached 30+ points

---

## ✨ Features

- **🎲 Animated dice** with spin-and-reveal animation
- **🌟 Particle starfield** background
- **🏆 Winner overlay** with confetti burst
- **📋 Roll history log** with colour-coded entries
- **💜 / 🩷 Player colour themes** (violet & coral)
- **📊 Live progress bars** per player
- **🎯 Score chips** showing recent rolls
- **⌨️ Keyboard shortcuts**: `Space`/`Enter` to roll, `N` for new game
- **📱 Fully responsive** — desktop, tablet & mobile

---

## 🛠️ Tech Stack

| Layer | Tech |
|-------|------|
| Backend | Python 3, Flask |
| Game Logic | Python `random`, dataclasses |
| Frontend | HTML5, CSS3 (Vanilla), JavaScript (ES6+) |
| Fonts | Google Fonts — Outfit, Space Grotesk |
| Images | AI-generated premium dice faces |
