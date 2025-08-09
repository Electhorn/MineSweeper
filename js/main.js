import { initDrawing, updateDrawSize, drawBoard, drawFace } from "./draw.js";
import input from "./input.js";
import ui, { DigitalDisplay } from "./ui.js";
import { debounce, setupHiDpiCanvas, isMobileDevice } from "./utils.js";
import state from "./state.js";
import * as gameController from "./gameController.js";
import { GAME_STATE, settings } from "./config.js";

// --- Constants ---
const MIN_PLAYABLE_TILE_SIZE = 16;
const MAX_AESTHETIC_TILE_SIZE = 40;
const RESIZE_DEBOUNCE_DELAY = 50; // A slightly higher delay for smoother resizing

// --- Module-scoped Variables (Cached Elements and Instances) ---
let canvas, faceCanvas, questionMarkBtn, canvasWrapper;
let mineCounterDisplay, timerDisplay;
let displayTileSize = MIN_PLAYABLE_TILE_SIZE;

/**
 * Recalculates dimensions, resizes canvases, and redraws the game.
 * This is the core logic for making the game responsive.
 */
function handleResize() {
  const gameConfig = state.getGameConfig();
  if (!gameConfig) return;

  // 1. Resize digital displays first
  mineCounterDisplay.resize();
  timerDisplay.resize();

  // 2. Re-setup the face canvas context
  const { ctx: newFaceCtx } = setupHiDpiCanvas(faceCanvas);

  // 3. Calculate the optimal tile size based on available space
  const availableWidth = canvasWrapper.clientWidth;
  const availableHeight = canvasWrapper.clientHeight;
  const tileSizeByWidth = Math.floor(availableWidth / gameConfig.cols);
  const tileSizeByHeight = Math.floor(availableHeight / gameConfig.rows);

  // Use a simpler, more robust sizing logic
  const fittingSize = Math.min(tileSizeByWidth, tileSizeByHeight);
  displayTileSize = Math.max(
    MIN_PLAYABLE_TILE_SIZE,
    Math.min(fittingSize, MAX_AESTHETIC_TILE_SIZE)
  );

  // 4. Update modules with the new tile size
  input.updateConfig({ cellSize: displayTileSize });
  updateDrawSize(displayTileSize);

  // 5. Set the new dimensions for the main canvas element
  const displayWidth = gameConfig.cols * displayTileSize;
  const displayHeight = gameConfig.rows * displayTileSize;
  canvas.style.width = `${displayWidth}px`;
  canvas.style.height = `${displayHeight}px`;

  // Vertically align the board based on fit
  canvasWrapper.style.alignItems =
    displayHeight > availableHeight ? "flex-start" : "center";

  // 6. Re-initialize drawing contexts with new dimensions
  const { ctx: newMainCtx } = setupHiDpiCanvas(canvas);
  initDrawing(newMainCtx, newFaceCtx, faceCanvas);

  // 7. Redraw the entire game state
  redrawGameState();
}

/**
 * Redraws the board and face based on the current game state.
 * A central function to call whenever a full redraw is needed.
 */
function redrawGameState() {
  const gameState = state.getGameState();

  // Redraw the face
  switch (gameState) {
    case GAME_STATE.VICTORY:
      drawFace("win");
      break;
    case GAME_STATE.DEFEAT:
      drawFace("lose");
      break;
    default:
      drawFace("smile");
  }

  // Redraw the board
  const isGameOver = [GAME_STATE.VICTORY, GAME_STATE.DEFEAT].includes(
    gameState
  );
  drawBoard(state.getBoard(), isGameOver);
}

/**
 * Connects the abstract input events (from input.js) to the
 * concrete game actions (from gameController.js).
 */
function bindInputEvents() {
  input.onLeftClick((r, c) =>
    gameController.handleLeftClick(r, c, timerDisplay)
  );

  input.onRightClick((r, c) =>
    gameController.handleRightClick(r, c, mineCounterDisplay)
  );

  input.onChordClick((r, c) => gameController.handleChord(r, c));

  input.onReset(() =>
    gameController.resetGame(mineCounterDisplay, timerDisplay)
  );

  input.onPress((r, c) => gameController.handleCellPress(r, c));

  input.onRelease(() => gameController.handleCellRelease());
}

/**
 * Wires up the listeners for the difficulty and settings menus.
 */
function initEventListeners() {
  // Debounced resize listener
  window.addEventListener(
    "resize",
    debounce(handleResize, RESIZE_DEBOUNCE_DELAY)
  );

  // Difficulty menu options
  document
    .querySelectorAll(".menu-option[data-difficulty]")
    .forEach((option) => {
      option.addEventListener("click", () => {
        const difficulty = option.dataset.difficulty;
        gameController.setupGame(
          difficulty,
          mineCounterDisplay,
          timerDisplay,
          handleResize
        );
      });
    });

  // Question mark toggle
  questionMarkBtn.addEventListener("click", () => {
    settings.useQuestionMarks = !settings.useQuestionMarks;
    questionMarkBtn.innerHTML = settings.useQuestionMarks
      ? `✓ Marks (?)`
      : `  Marks (?)`;
  });
}

/**
 * Main application initialization function.
 * Orchestrates the setup of all modules in the correct order.
 */
function initializeApp() {
  try {
    // 1. Cache DOM Elements
    canvas = document.getElementById("minesweeper-canvas");
    faceCanvas = document.getElementById("face-canvas");
    canvasWrapper = document.querySelector(".canvas-wrapper");
    questionMarkBtn = document.getElementById("toggle-question-marks-btn");
    if (!canvas || !faceCanvas || !canvasWrapper || !questionMarkBtn) {
      throw new Error("One or more required DOM elements are missing.");
    }

    // 2. Initialize Displays
    mineCounterDisplay = new DigitalDisplay(
      "mine-counter-canvas",
      setupHiDpiCanvas
    );
    timerDisplay = new DigitalDisplay("timer-canvas", setupHiDpiCanvas);
    if (!mineCounterDisplay.ctx || !timerDisplay.ctx) {
      throw new Error("Failed to initialize digital displays.");
    }

    // 3. Initialize Drawing Module
    const { ctx: initialMainCtx } = setupHiDpiCanvas(canvas);
    const { ctx: initialFaceCtx } = setupHiDpiCanvas(faceCanvas);
    initDrawing(initialMainCtx, initialFaceCtx, faceCanvas);

    // 4. Initialize Input System
    input.init(canvas, faceCanvas, { cellSize: displayTileSize });
    bindInputEvents();

    // 5. Initialize UI (Modals & Menus)
    ui.init();
    ui.onCustomGame((customConfig) => {
      gameController.setupGame(
        customConfig,
        mineCounterDisplay,
        timerDisplay,
        handleResize
      );
    });

    // 6. Initialize Global Event Listeners
    initEventListeners();
    questionMarkBtn.innerHTML = settings.useQuestionMarks
      ? `✓ Marks (?)`
      : `  Marks (?)`;

    // 7. Start the Game
    gameController.setupGame(
      "beginner",
      mineCounterDisplay,
      timerDisplay,
      handleResize
    );
  } catch (error) {
    console.error("Fatal error during application initialization:", error);
    document.body.innerHTML =
      "<h2>Failed to load game. Please check the console for errors.</h2>";
  }
}

// Start the application when the DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeApp);
} else {
  initializeApp();
}
