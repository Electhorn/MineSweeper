import { GAME_STATE } from "./config.js";

const state = (() => {
  // Private state variables
  let gameState = GAME_STATE.IDLE;
  let currentDifficulty = "beginner";
  let gameConfig = null;
  let board = [];
  let flagsPlaced = 0;
  let time = 0;
  let timerInterval = null;
  let revealedCells = 0;

  // Constants
  const MAX_TIME = 999;

  return {
    // Game state management
    getGameState: () => gameState,
    setGameState: (newState) => {
      if (Object.values(GAME_STATE).includes(newState)) {
        gameState = newState;
      } else {
        throw new Error(`Invalid game state: ${newState}`);
      }
    },

    // Difficulty management
    getCurrentDifficulty: () => currentDifficulty,
    setCurrentDifficulty: (newDifficulty) => {
      if (
        typeof newDifficulty === "string" ||
        typeof newDifficulty === "object"
      ) {
        currentDifficulty = newDifficulty;
      } else {
        throw new Error(`Invalid difficulty type: ${typeof newDifficulty}`);
      }
    },

    // Game configuration
    getGameConfig: () => gameConfig,
    setGameConfig: (newConfig) => {
      if (newConfig && typeof newConfig === "object") {
        gameConfig = { ...newConfig };
      } else {
        throw new Error(`Invalid game config: ${newConfig}`);
      }
    },

    // Board management
    getBoard: () => board,
    setBoard: (newBoard) => {
      if (Array.isArray(newBoard)) {
        board = newBoard;
      } else {
        throw new Error(`Invalid board: ${newBoard}`);
      }
    },
    getCell: (r, c) => {
      if (board[r] && board[r][c] !== undefined) {
        return board[r][c];
      }
      return null;
    },

    // Revealed cells management
    getRevealedCells: () => revealedCells,
    incrementRevealedCells: () => {
      revealedCells++;
    },
    resetRevealedCells: () => {
      revealedCells = 0;
    },

    // Flags management
    getFlagsPlaced: () => flagsPlaced,
    incrementFlags: () => {
      flagsPlaced++;
    },
    decrementFlags: () => {
      if (flagsPlaced > 0) {
        flagsPlaced--;
      }
    },
    resetFlags: () => {
      flagsPlaced = 0;
    },

    // Time management
    getTime: () => time,
    setTime: (newTime) => {
      if (typeof newTime === "number" && newTime >= 0) {
        time = Math.min(newTime, MAX_TIME);
      } else {
        throw new Error(`Invalid time value: ${newTime}`);
      }
    },
    incrementTime: () => {
      if (time < MAX_TIME) {
        time++;
      }
    },
    resetTime: () => {
      time = 0;
    },

    // Timer interval management
    getTimerInterval: () => timerInterval,
    setTimerInterval: (intervalId) => {
      if (intervalId === null || typeof intervalId === "number") {
        timerInterval = intervalId;
      } else {
        throw new Error(`Invalid interval ID: ${intervalId}`);
      }
    },
    clearTimerInterval: () => {
      if (timerInterval !== null) {
        clearInterval(timerInterval);
        timerInterval = null;
      }
    },

    // Utility methods
    /**
     * Resets all game state to initial values
     */
    resetAll: () => {
      gameState = GAME_STATE.IDLE;
      flagsPlaced = 0;
      time = 0;
      revealedCells = 0;

      if (timerInterval !== null) {
        clearInterval(timerInterval);
        timerInterval = null;
      }
    },

    /**
     * Checks if the game is in a playable state
     * @returns {boolean} Whether game is running or idle
     */
    isGameActive: () => {
      return gameState === GAME_STATE.IDLE || gameState === GAME_STATE.RUNNING;
    },

    /**
     * Gets a snapshot of the current state
     * @returns {Object} Current state values
     */
    getSnapshot: () => {
      return {
        gameState,
        currentDifficulty,
        flagsPlaced,
        time,
        revealedCells,
        hasTimer: timerInterval !== null,
      };
    },
  };
})();

export default state;
