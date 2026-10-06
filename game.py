"""
game.py — Core Dice Game Logic Engine
======================================
Handles all game state management independent of Flask routes.
"""

import random
from dataclasses import dataclass, field
from typing import Optional


WINNING_SCORE = 30
EXTRA_THROW_VALUES = {1, 6}   # Rolling 1 or 6 grants an extra throw
NUM_PLAYERS = 2


@dataclass
class Player:
    """Represents a single player's state."""
    player_id: int
    name: str
    score: int = 0

    def add_score(self, points: int) -> None:
        self.score += points

    def has_won(self) -> bool:
        return self.score >= WINNING_SCORE

    def to_dict(self) -> dict:
        return {
            "player_id": self.player_id,
            "name": self.name,
            "score": self.score,
        }


@dataclass
class GameState:
    """Full game state container."""
    players: list = field(default_factory=list)
    current_player_index: int = 0
    winner_id: Optional[int] = None
    last_roll: Optional[int] = None
    extra_throw: bool = False
    game_over: bool = False
    roll_history: list = field(default_factory=list)   # per-turn log

    @property
    def current_player(self) -> Player:
        return self.players[self.current_player_index]

    @property
    def other_player(self) -> Player:
        other_index = 1 - self.current_player_index
        return self.players[other_index]

    def to_dict(self) -> dict:
        return {
            "players": [p.to_dict() for p in self.players],
            "current_player_id": self.current_player.player_id,
            "winner_id": self.winner_id,
            "last_roll": self.last_roll,
            "extra_throw": self.extra_throw,
            "game_over": self.game_over,
            "roll_history": self.roll_history,
        }


class DiceGame:
    """
    Dice Game Engine.

    Rules:
    - 2 players take turns rolling a single six-sided die.
    - Roll value is added to the current player's score.
    - Rolling 1 or 6 grants an extra throw immediately.
    - Rolling 2-5 ends the turn; the other player goes next.
    - First player to reach WINNING_SCORE (30) wins.
    """

    def __init__(self, player_names: Optional[list[str]] = None) -> None:
        names = player_names or [f"Player {i+1}" for i in range(NUM_PLAYERS)]
        if len(names) != NUM_PLAYERS:
            raise ValueError(f"Exactly {NUM_PLAYERS} player names required.")
        self.state = GameState(
            players=[Player(player_id=i + 1, name=names[i]) for i in range(NUM_PLAYERS)]
        )

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def get_state(self) -> dict:
        """Return serialisable game state."""
        return self.state.to_dict()

    def roll(self) -> dict:
        """
        Perform a dice roll for the current player.

        Returns a dict describing the outcome of this roll.
        """
        if self.state.game_over:
            return {
                "error": "Game is already over. Please start a new game.",
                **self.state.to_dict(),
            }

        # Roll the die
        roll_value = random.randint(1, 6)
        self.state.last_roll = roll_value

        current = self.state.current_player
        current.add_score(roll_value)

        # Build a log entry
        log_entry = {
            "player_id": current.player_id,
            "player_name": current.name,
            "roll": roll_value,
            "score_after": current.score,
        }

        # Check win condition first
        if current.has_won():
            self.state.game_over = True
            self.state.winner_id = current.player_id
            self.state.extra_throw = False
            log_entry["event"] = "win"
            self.state.roll_history.append(log_entry)
            return {"roll": roll_value, "event": "win", **self.state.to_dict()}

        # Check for extra throw
        if roll_value in EXTRA_THROW_VALUES:
            self.state.extra_throw = True
            log_entry["event"] = "extra_throw"
            self.state.roll_history.append(log_entry)
            return {"roll": roll_value, "event": "extra_throw", **self.state.to_dict()}

        # Normal turn end — switch to other player
        self.state.extra_throw = False
        self._switch_turn()
        log_entry["event"] = "turn_end"
        self.state.roll_history.append(log_entry)
        return {"roll": roll_value, "event": "turn_end", **self.state.to_dict()}

    def reset(self, player_names: Optional[list[str]] = None) -> dict:
        """Reset the game to its initial state."""
        names = player_names or [p.name for p in self.state.players]
        self.__init__(player_names=names)
        return self.state.to_dict()

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _switch_turn(self) -> None:
        self.state.current_player_index = 1 - self.state.current_player_index
