import { initDrawing, updateDrawSize, drawBoard, drawFace } from "./draw.js";
import input from "./input.js";
import ui, { DigitalDisplay } from "./ui.js";
import { debounce, setupHiDpiCanvas, isMobileDevice } from "./utils.js";
import state from "./state.js";
import * as gameController from "./gameController.js";
import { GAME_STATE, settings } from "./config.js";

document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("minesweeper-canvas");
  const faceCanvas = document.getElementById("face-canvas");

  initDrawing(
    canvas.getContext("2d"),
    setupHiDpiCanvas(faceCanvas).ctx,
    faceCanvas
  );

  const mineCounterDisplay = new DigitalDisplay(
    "mine-counter-canvas",
    setupHiDpiCanvas
  );
  const timerDisplay = new DigitalDisplay("timer-canvas", setupHiDpiCanvas);

  let displayTileSize = 16;

  function handleResize() {
    if (!state.getGameConfig()) return;

    mineCounterDisplay.resize();
    timerDisplay.resize();
    const { ctx: newFaceCtx } = setupHiDpiCanvas(faceCanvas);

    const wrapper = document.querySelector(".canvas-wrapper");
    wrapper.offsetHeight;

    const MIN_PLAYABLE_TILE_SIZE = 16;
    const MAX_AESTHETIC_TILE_SIZE = 40;

    const availableWidth = wrapper.clientWidth - 2;
    const availableHeight = wrapper.clientHeight - 2;

    const gameConfig = state.getGameConfig();
    const tileSizeByWidth = Math.floor(availableWidth / gameConfig.cols);
    const tileSizeByHeight = Math.floor(availableHeight / gameConfig.rows);

    const isStandardOnDesktop =
      typeof state.getCurrentDifficulty() === "string" && !isMobileDevice();

    if (isStandardOnDesktop) {
      const fittingSize = Math.min(tileSizeByWidth, tileSizeByHeight);
      displayTileSize = Math.min(fittingSize, MAX_AESTHETIC_TILE_SIZE);
      wrapper.style.alignItems = "center";
    } else {
      let chosenSize = MIN_PLAYABLE_TILE_SIZE;
      if (gameConfig.rows * tileSizeByWidth <= availableHeight) {
        chosenSize = tileSizeByWidth;
      } else if (gameConfig.cols * tileSizeByHeight <= availableWidth) {
        chosenSize = tileSizeByHeight;
      } else {
        chosenSize = Math.min(tileSizeByWidth, tileSizeByHeight);
      }
      displayTileSize = Math.max(
        MIN_PLAYABLE_TILE_SIZE,
        Math.min(chosenSize, MAX_AESTHETIC_TILE_SIZE)
      );
      if (gameConfig.rows * displayTileSize > availableHeight) {
        wrapper.style.alignItems = "flex-start";
      } else {
        wrapper.style.alignItems = "center";
      }
    }

    input.updateConfig({ cellSize: displayTileSize });
    updateDrawSize(displayTileSize);

    const displayWidth = gameConfig.cols * displayTileSize;
    const displayHeight = gameConfig.rows * displayTileSize;

    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;

    const { ctx: newMainCtx } = setupHiDpiCanvas(canvas);
    initDrawing(newMainCtx, newFaceCtx, faceCanvas);

    const gameState = state.getGameState();
    if (gameState === GAME_STATE.VICTORY) drawFace("win");
    else if (gameState === GAME_STATE.DEFEAT) drawFace("lose");
    else drawFace("smile");

    const isGameOver =
      gameState === GAME_STATE.VICTORY || gameState === GAME_STATE.DEFEAT;
    drawBoard(state.getBoard(), isGameOver);
  }

  function bindInputEvents() {
    input.onLeftClick((r, c) =>
      gameController.handleLeftClick(r, c, timerDisplay)
    );
    input.onRightClick((r, c) =>
      gameController.handleRightClick(r, c, mineCounterDisplay)
    );
    input.onChordClick(gameController.handleChord);
    input.onReset(() =>
      gameController.resetGame(mineCounterDisplay, timerDisplay)
    );

    input.onPress(gameController.handleCellPress);
    input.onRelease(gameController.handleCellRelease);
  }

  ui.init();
  ui.onCustomGame((customConfig) => {
    gameController.setupGame(
      customConfig,
      mineCounterDisplay,
      timerDisplay,
      handleResize
    );
  });

  const questionMarkBtn = document.getElementById("toggle-question-marks-btn");

  function updateQuestionMarkButton() {
    if (settings.useQuestionMarks) {
      questionMarkBtn.innerHTML = `✓ Marks (?)`;
    } else {
      questionMarkBtn.innerHTML = `   Marks (?)`;
    }
  }

  questionMarkBtn.addEventListener("click", () => {
    settings.useQuestionMarks = !settings.useQuestionMarks;
    updateQuestionMarkButton();
  });

  updateQuestionMarkButton();
  document
    .querySelectorAll(".menu-option[data-difficulty]")
    .forEach((option) => {
      option.addEventListener("click", () => {
        const difficulty = option.dataset.difficulty;
        if (difficulty !== state.getCurrentDifficulty()) {
          gameController.setupGame(
            difficulty,
            mineCounterDisplay,
            timerDisplay,
            handleResize
          );
        }
      });
    });

  window.addEventListener("resize", debounce(handleResize, 30));

  input.init(canvas, faceCanvas, { cellSize: displayTileSize });
  bindInputEvents();

  gameController.setupGame(
    "beginner",
    mineCounterDisplay,
    timerDisplay,
    handleResize
  );
});
