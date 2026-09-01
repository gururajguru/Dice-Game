"""
app.py — Flask API Routes
==========================
Thin HTTP layer. All game logic lives in game.py.
"""

from flask import Flask, render_template, request, jsonify, session
import secrets

from game import DiceGame

app = Flask(__name__)
app.secret_key = secrets.token_hex(32)   # needed for session storage

# ---------------------------------------------------------------------------
# Helper: retrieve or create a DiceGame instance stored in the user's session
# ---------------------------------------------------------------------------

def _get_game() -> DiceGame:
    """
    Fetch the game state stored in the server-side session.
    If none exists (or it was cleared), start a fresh game.
    """
    if "game_state" not in session:
        session["game_state"] = None

    game = app.config.get("game_instance")
    if game is None:
        game = DiceGame()
        app.config["game_instance"] = game
    return game


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.route("/")
def index():
    """Serve the main game page."""
    return render_template("index.html")


@app.route("/api/state", methods=["GET"])
def get_state():
    """Return the current game state as JSON."""
    game = _get_game()
    return jsonify(game.get_state())


@app.route("/api/roll", methods=["POST"])
def roll():
    """
    Roll the dice for the current player.
    Returns updated game state + roll info.
    """
    game = _get_game()
    result = game.roll()
    return jsonify(result)


@app.route("/api/reset", methods=["POST"])
def reset():
    """
    Reset the game. Optionally accepts JSON body:
    { "player_names": ["Alice", "Bob"] }
    """
    data = request.get_json(silent=True) or {}
    player_names = data.get("player_names")

    game = _get_game()
    state = game.reset(player_names=player_names)
    return jsonify(state)


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    app.run(debug=True, port=5000)
