import state from "./state.js";
import { GAME_STATE, difficulty, settings } from "./config.js";
import * as gameLogic from "./gameLogic.js";
import { drawBoard, drawFace, updateDrawSize } from "./draw.js";
import { isMobileDevice, isPortraitOrientation } from "./utils.js";
import { checkAndSetHighScore } from "./highScore.js";

function _updateFace() {
  const gameState = state.getGameState();
  if (gameState === GAME_STATE.VICTORY) drawFace("win");
  else if (gameState === GAME_STATE.DEFEAT) drawFace("lose");
  else drawFace("smile");
}

function _updateUIState(mineCounterDisplay, timerDisplay) {
  const config = state.getGameConfig();
  mineCounterDisplay.display(config.mineCount - state.getFlagsPlaced());
  timerDisplay.display(state.getTime());

  _updateFace();

  drawBoard(
    state.getBoard(),
    state.getGameState() === GAME_STATE.VICTORY ||
      state.getGameState() === GAME_STATE.DEFEAT
  );
}

function _handleGameWin() {
  drawFace("win");
  const currentDifficulty = state.getCurrentDifficulty();
  const time = state.getTime();
  checkAndSetHighScore(currentDifficulty, time);
}

function _handleGameLoss() {
  drawFace("lose");
}

export function setupGameConfig() {
  let baseConfig;
  const currentDiff = state.getCurrentDifficulty();

  if (typeof currentDiff === "object") {
    baseConfig = { ...currentDiff };
    document
      .querySelectorAll(".menu-option[data-difficulty]")
      .forEach((opt) => {
        const text = opt.dataset.text;
        const char = text.charAt(0);
        opt.innerHTML = `  <u>${char}</u>${text.substring(1)}`;
      });
  } else {
    baseConfig = { ...difficulty[currentDiff] };
    document
      .querySelectorAll(".menu-option[data-difficulty]")
      .forEach((opt) => {
        const text = opt.dataset.text;
        const char = text.charAt(0);
        opt.innerHTML =
          opt.dataset.difficulty === currentDiff
            ? `✓ <u>${char}</u>${text.substring(1)}`
            : `  <u>${char}</u>${text.substring(1)}`;
      });
  }

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

export function resetGameState() {
  state.setGameState(GAME_STATE.IDLE);
  state.resetFlags();
  state.resetRevealedCells();
  state.clearTimerInterval();
  state.resetTime();
  gameLogic.initBoard();
}

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

export function resetGame(mineCounterDisplay, timerDisplay) {
  resetGameState();
  _updateUIState(mineCounterDisplay, timerDisplay);
}

export function handleLeftClick(r, c, timerDisplay) {
  const gameState = state.getGameState();
  if (gameState === GAME_STATE.VICTORY || gameState === GAME_STATE.DEFEAT)
    return;

  const cell = state.getCell(r, c);
  if (!cell || cell.isFlagged || cell.isRevealed) return;

  if (state.getGameState() === GAME_STATE.IDLE) {
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

  if (state.getGameState() === GAME_STATE.VICTORY) _handleGameWin();
  if (state.getGameState() === GAME_STATE.DEFEAT) _handleGameLoss();
}

export function handleRightClick(r, c, mineCounterDisplay) {
  const gameState = state.getGameState();
  if (gameState === GAME_STATE.VICTORY || gameState === GAME_STATE.DEFEAT)
    return;

  gameLogic.toggleCellMark(r, c);

  mineCounterDisplay.display(
    state.getGameConfig().mineCount - state.getFlagsPlaced()
  );
  drawBoard(state.getBoard(), false);
}

export function handleChord(r, c) {
  if (state.getGameState() !== GAME_STATE.RUNNING) return;

  gameLogic.attemptChord(r, c);

  const isGameOver =
    state.getGameState() === GAME_STATE.VICTORY ||
    state.getGameState() === GAME_STATE.DEFEAT;
  drawBoard(state.getBoard(), isGameOver);
  if (isGameOver) {
    if (state.getGameState() === GAME_STATE.VICTORY) _handleGameWin();
    if (state.getGameState() === GAME_STATE.DEFEAT) _handleGameLoss();
  }
}

export function handleCellPress(r, c) {
  const gameState = state.getGameState();
  if (gameState === GAME_STATE.VICTORY || gameState === GAME_STATE.DEFEAT) {
    return;
  }

  const cell = state.getCell(r, c);

  if (cell && !cell.isRevealed && !cell.isFlagged) {
    drawFace("surprise");
  }
}

export function handleCellRelease() {
  _updateFace();
}
