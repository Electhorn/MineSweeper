import { GAME_STATE } from "./config.js";

const state = (() => {
  let gameState = GAME_STATE.IDLE;
  let currentDifficulty = "beginner";
  let gameConfig;
  let board = [];
  let flagsPlaced = 0;
  let time = 0;
  let timerInterval = null;
  let revealedCells = 0;

  return {
    getGameState: () => gameState,
    setGameState: (newState) => (gameState = newState),

    getCurrentDifficulty: () => currentDifficulty,
    setCurrentDifficulty: (newDifficulty) =>
      (currentDifficulty = newDifficulty),
    getGameConfig: () => gameConfig,
    setGameConfig: (newConfig) => (gameConfig = newConfig),

    getBoard: () => board,
    setBoard: (newBoard) => (board = newBoard),
    getCell: (r, c) => board[r]?.[c],

    getRevealedCells: () => revealedCells,
    incrementRevealedCells: () => {
      revealedCells++;
    },
    resetRevealedCells: () => {
      revealedCells = 0;
    },

    getFlagsPlaced: () => flagsPlaced,
    incrementFlags: () => {
      flagsPlaced++;
    },
    decrementFlags: () => {
      flagsPlaced--;
    },
    resetFlags: () => {
      flagsPlaced = 0;
    },

    getTime: () => time,
    setTime: (newTime) => {
      time = newTime;
    },
    incrementTime: () => {
      if (time < 999) {
        time++;
      }
    },
    resetTime: () => {
      time = 0;
    },

    getTimerInterval: () => timerInterval,
    setTimerInterval: (intervalId) => {
      timerInterval = intervalId;
    },
    clearTimerInterval: () => {
      clearInterval(timerInterval);
      timerInterval = null;
    },
  };
})();
export default state;
