import state from "./state.js";
import { GAME_STATE, difficulty, settings } from "./config.js";
import * as gameLogic from "./gameLogic.js";
import { drawBoard, drawFace, updateDrawSize } from "./draw.js";
import { isMobileDevice, isPortraitOrientation } from "./utils.js";
import { checkAndSetHighScore } from "./highScore.js";

// Constants for UI states
const FACE_STATES = {
  WIN: "win",
  LOSE: "lose",
  SMILE: "smile",
  SURPRISE: "surprise",
};

/**
 * Updates the face display based on current game state
 */
function _updateFace() {
  const gameState = state.getGameState();
  switch (gameState) {
    case GAME_STATE.VICTORY:
      drawFace(FACE_STATES.WIN);
      break;
    case GAME_STATE.DEFEAT:
      drawFace(FACE_STATES.LOSE);
      break;
    default:
      drawFace(FACE_STATES.SMILE);
  }
}

/**
 * Updates all UI elements to reflect current game state
 */
function _updateUIState(mineCounterDisplay, timerDisplay) {
  const config = state.getGameConfig();
  if (!config) return;

  mineCounterDisplay.display(config.mineCount - state.getFlagsPlaced());
  timerDisplay.display(state.getTime());
  _updateFace();
  drawBoard(
    state.getBoard(),
    state.getGameState() === GAME_STATE.VICTORY ||
      state.getGameState() === GAME_STATE.DEFEAT
  );
}

/**
 * Handles game win state
 */
function _handleGameWin() {
  drawFace(FACE_STATES.WIN);
  const currentDifficulty = state.getCurrentDifficulty();
  const time = state.getTime();
  checkAndSetHighScore(currentDifficulty, time);
}

/**
 * Handles game loss state
 */
function _handleGameLoss() {
  drawFace(FACE_STATES.LOSE);
}

/**
 * Configures game based on difficulty and device orientation
 */
export function setupGameConfig() {
  const currentDiff = state.getCurrentDifficulty();
  const isCustomDifficulty = typeof currentDiff === "object";
  const baseConfig = isCustomDifficulty
    ? { ...currentDiff }
    : { ...difficulty[currentDiff] };

  // Update menu UI
  document.querySelectorAll(".menu-option[data-difficulty]").forEach((opt) => {
    const text = opt.dataset.text;
    const char = text.charAt(0);
    const isChecked =
      !isCustomDifficulty && opt.dataset.difficulty === currentDiff;
    opt.innerHTML = isChecked
      ? `✓ <u>${char}${text.substring(1)}`
      : `  <u>${char}${text.substring(1)}`;
  });

  // Adjust for mobile portrait orientation
  const newConfig = { ...baseConfig };
  if (
    isMobileDevice() &&
    isPortraitOrientation() &&
    newConfig.cols > newConfig.rows
  ) {
    [newConfig.rows, newConfig.cols] = [newConfig.cols, newConfig.rows];
  }

  state.setGameConfig(newConfig);
}

/**
 * Resets all game state variables
 */
export function resetGameState() {
  state.setGameState(GAME_STATE.IDLE);
  state.resetFlags();
  state.resetRevealedCells();
  state.clearTimerInterval();
  state.resetTime();
  gameLogic.initBoard();
}

/**
 * Initializes a new game with specified difficulty
 */
export function setupGame(
  newDifficulty,
  mineCounterDisplay,
  timerDisplay,
  handleResize
) {
  state.setCurrentDifficulty(newDifficulty);
  setupGameConfig();
  resetGameState();
  _updateUIState(mineCounterDisplay, timerDisplay);
  handleResize();
}

/**
 * Resets the current game
 */
export function resetGame(mineCounterDisplay, timerDisplay) {
  resetGameState();
  _updateUIState(mineCounterDisplay, timerDisplay);
}

/**
 * Handles left-click (reveal) on a cell
 */
export function handleLeftClick(r, c, timerDisplay) {
  const gameState = state.getGameState();
  if (gameState === GAME_STATE.VICTORY || gameState === GAME_STATE.DEFEAT) {
    return;
  }

  const cell = state.getCell(r, c);
  if (!cell || cell.isFlagged || cell.isRevealed) return;

  // Start game on first click
  if (gameState === GAME_STATE.IDLE) {
    state.setGameState(GAME_STATE.RUNNING);
    const mineLocations = gameLogic.popMines(r, c);
    gameLogic.calcNeighbor(mineLocations);

    const timerInterval = setInterval(() => {
      state.incrementTime();
      timerDisplay.display(state.getTime());
    }, 1000);
    state.setTimerInterval(timerInterval);
  }

  gameLogic.revealCell(r, c);
  drawBoard(state.getBoard(), state.getGameState() === GAME_STATE.DEFEAT);

  // Handle game end states
  const currentGameState = state.getGameState();
  if (currentGameState === GAME_STATE.VICTORY) {
    _handleGameWin();
  } else if (currentGameState === GAME_STATE.DEFEAT) {
    _handleGameLoss();
  }
}

/**
 * Handles right-click (flag) on a cell
 */
export function handleRightClick(r, c, mineCounterDisplay) {
  const gameState = state.getGameState();
  if (gameState === GAME_STATE.VICTORY || gameState === GAME_STATE.DEFEAT) {
    return;
  }

  gameLogic.toggleCellMark(r, c);
  const config = state.getGameConfig();
  if (config) {
    mineCounterDisplay.display(config.mineCount - state.getFlagsPlaced());
  }
  drawBoard(state.getBoard(), false);
}

/**
 * Handles chording (reveal adjacent cells) action
 */
export function handleChord(r, c) {
  if (state.getGameState() !== GAME_STATE.RUNNING) return;

  gameLogic.attemptChord(r, c);
  const isGameOver = [GAME_STATE.VICTORY, GAME_STATE.DEFEAT].includes(
    state.getGameState()
  );

  drawBoard(state.getBoard(), isGameOver);

  if (isGameOver) {
    if (state.getGameState() === GAME_STATE.VICTORY) {
      _handleGameWin();
    } else if (state.getGameState() === GAME_STATE.DEFEAT) {
      _handleGameLoss();
    }
  }
}

/**
 * Handles visual feedback when pressing a cell
 */
export function handleCellPress(r, c) {
  const gameState = state.getGameState();
  if ([GAME_STATE.VICTORY, GAME_STATE.DEFEAT].includes(gameState)) {
    return;
  }

  const cell = state.getCell(r, c);
  if (cell && !cell.isRevealed && !cell.isFlagged) {
    drawFace(FACE_STATES.SURPRISE);
  }
}

/**
 * Handles releasing cell press
 */
export function handleCellRelease() {
  _updateFace();
}
