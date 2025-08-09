import { getHighScores, resetHighScores } from "./highScore.js";

export class DigitalDisplay {
  constructor(canvasId, setupHiDpiCanvas) {
    const canvas = document.getElementById(canvasId);
    this.canvas = canvas;
    if (!canvas) {
      console.error(`Canvas con ID "${canvasId}" no encontrado.`);
      return;
    }
    this.setupHiDpiCanvas = setupHiDpiCanvas;

    const { ctx, width, height } = this.setupHiDpiCanvas(this.canvas);
    this.ctx = ctx;
    this.width = width;
    this.height = height;
    this.currentValue = 0;

    this.config = {
      digitCount: 3,
      digitWidth: 13,
      digitHeight: 23,
      segmentWidth: 9,
      segmentHeight: 9,
      segmentThickness: 2,
      digitSpacing: 3,
      colorOn: "#FF0000",
      colorOff: "#300000",
      bgColor: "black",
    };

    this.segmentMap = [
      [true, true, true, true, true, true, false],
      [false, true, true, false, false, false, false],
      [true, true, false, true, true, false, true],
      [true, true, true, true, false, false, true],
      [false, true, true, false, false, true, true],
      [true, false, true, true, false, true, true],
      [true, false, true, true, true, true, true],
      [true, true, true, false, false, false, false],
      [true, true, true, true, true, true, true],
      [true, true, true, true, false, true, true],
    ];

    this._defineSegmentPaths();
  }
  resize() {
    const { ctx, width, height } = this.setupHiDpiCanvas(this.canvas);
    this.ctx = ctx;
    this.width = width;
    this.height = height;
    this.display(this.currentValue);
  }

  _defineSegmentPaths() {
    const w = this.config.digitWidth;
    const h = this.config.digitHeight;
    const t = this.config.segmentThickness;
    const t2 = t / 2;

    this.paths = {
      A: [
        [t, t2],
        [w - t, t2],
        [w - t - t2, t + t2],
        [t + t2, t + t2],
      ],

      B: [
        [w - t2, t],
        [w - t2, h / 2],
        [w - t - t2, h / 2 - t2],
        [w - t - t2, t + t2],
      ],

      C: [
        [w - t - t2, h / 2 + t2],
        [w - t - t2, h - t - t2],
        [w - t2, h - t],
        [w - t2, h / 2],
      ],

      D: [
        [t + t2, h - t - t2],
        [w - t - t2, h - t - t2],
        [w - t, h - t2],
        [t, h - t2],
      ],

      E: [
        [t2, h / 2],
        [t2, h - t],
        [t + t2, h - t - t2],
        [t + t2, h / 2 + t2],
      ],

      F: [
        [t + t2, t + t2],
        [t + t2, h / 2 - t2],
        [t2, h / 2],
        [t2, t],
      ],

      G: [
        [t + t2, h / 2 - t2],
        [w - t - t2, h / 2 - t2],
        [w - t, h / 2],
        [w - t - t2, h / 2 + t2],
        [t + t2, h / 2 + t2],
        [t, h / 2],
      ],
    };
  }

  _drawSegment(path, color, offsetX, offsetY) {
    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.moveTo(offsetX + path[0][0], offsetY + path[0][1]);
    for (let i = 1; i < path.length; i++) {
      this.ctx.lineTo(offsetX + path[i][0], offsetY + path[i][1]);
    }
    this.ctx.closePath();
    this.ctx.fill();
  }

  _drawDigit(digit, position) {
    const totalDigitsWidth =
      this.config.digitWidth * this.config.digitCount +
      this.config.digitSpacing * (this.config.digitCount - 1);
    const initialOffsetX = (this.width - totalDigitsWidth) / 2;
    const offsetY = (this.height - this.config.digitHeight) / 2;

    const digitOffsetX =
      initialOffsetX +
      position * (this.config.digitWidth + this.config.digitSpacing);

    const activeSegments = this.segmentMap[digit];
    const segmentKeys = ["A", "B", "C", "D", "E", "F", "G"];

    segmentKeys.forEach((key) =>
      this._drawSegment(
        this.paths[key],
        this.config.colorOff,
        digitOffsetX,
        offsetY
      )
    );

    segmentKeys.forEach((key, index) => {
      if (activeSegments[index]) {
        this._drawSegment(
          this.paths[key],
          this.config.colorOn,
          digitOffsetX,
          offsetY
        );
      }
    });
  }

  display(number) {
    this.currentValue = number;
    this.ctx.fillStyle = this.config.bgColor;
    this.ctx.fillRect(0, 0, this.width, this.height);

    if (number < 0) {
      if (number < -99) {
        number = -99;
      }
      const absNumber = Math.abs(number);
      const tens = Math.floor(absNumber / 10);
      const units = absNumber % 10;

      const totalDigitsWidth =
        this.config.digitWidth * this.config.digitCount +
        this.config.digitSpacing * (this.config.digitCount - 1);
      const initialOffsetX = (this.width - totalDigitsWidth) / 2;
      const offsetY = (this.height - this.config.digitHeight) / 2;
      const digitOffsetX = initialOffsetX;

      Object.values(this.paths).forEach((path) =>
        this._drawSegment(path, this.config.colorOff, digitOffsetX, offsetY)
      );
      this._drawSegment(
        this.paths.G,
        this.config.colorOn,
        digitOffsetX,
        offsetY
      );

      this._drawDigit(tens, 1);
      this._drawDigit(units, 2);
    } else {
      if (number > 999) {
        number = 999;
      }
      const hundreds = Math.floor(number / 100);
      const tens = Math.floor((number % 100) / 10);
      const units = number % 10;

      this._drawDigit(hundreds, 0);
      this._drawDigit(tens, 1);
      this._drawDigit(units, 2);
    }
  }
}

const ui = (() => {
  let onCustomGameCallback = null;

  let customModalOverlay, customBtn, closeBtn, cancelBtn, okBtn;
  let heightInput, widthInput, minesInput;

  let highscoreModalOverlay,
    highscoreBtn,
    closeHighscoreBtn,
    okHighscoreBtn,
    resetScoresBtn;
  let beginnerScoreEl, intermediateScoreEl, expertScoreEl;

  function _openModal() {
    customModalOverlay.classList.remove("hidden");
  }

  function _closeModal() {
    customModalOverlay.classList.add("hidden");
  }

  function _handleOkClick() {
    const height = parseInt(heightInput.value);
    const width = parseInt(widthInput.value);
    const mines = parseInt(minesInput.value);

    if (
      height >= 9 &&
      height <= 24 &&
      width >= 9 &&
      width <= 30 &&
      mines >= 10 &&
      mines <= height * width - 9
    ) {
      if (onCustomGameCallback) {
        const customConfig = { rows: height, cols: width, mineCount: mines };
        onCustomGameCallback(customConfig);
      }
      _closeModal();
    } else {
      alert("Invalid values. Please check the limits.");
    }
  }

  function _populateHighscoreModal() {
    const scores = getHighScores();
    beginnerScoreEl.textContent =
      scores.beginner === 999 ? "---" : scores.beginner;
    intermediateScoreEl.textContent =
      scores.intermediate === 999 ? "---" : scores.intermediate;
    expertScoreEl.textContent = scores.expert === 999 ? "---" : scores.expert;
  }

  function _openHighscoreModal() {
    _populateHighscoreModal();
    highscoreModalOverlay.classList.remove("hidden");
  }

  function _closeHighscoreModal() {
    highscoreModalOverlay.classList.add("hidden");
  }

  function _handleResetScoresClick() {
    if (confirm("Are you sure you want to reset all high scores?")) {
      resetHighScores();
      _populateHighscoreModal();
    }
  }

  function init() {
    customModalOverlay = document.getElementById("custom-modal-overlay");
    customBtn = document.getElementById("custom-difficulty-btn");
    closeBtn = document.getElementById("modal-close-btn");
    cancelBtn = document.getElementById("modal-cancel-btn");
    okBtn = document.getElementById("modal-ok-btn");
    heightInput = document.getElementById("custom-height");
    widthInput = document.getElementById("custom-width");
    minesInput = document.getElementById("custom-mines");

    customBtn.addEventListener("click", _openModal);
    closeBtn.addEventListener("click", _closeModal);
    cancelBtn.addEventListener("click", _closeModal);
    customModalOverlay.addEventListener("click", (e) => {
      if (e.target === customModalOverlay) _closeModal();
    });
    okBtn.addEventListener("click", _handleOkClick);

    highscoreModalOverlay = document.getElementById("highscore-modal-overlay");
    highscoreBtn = document.getElementById("highscore-btn");
    closeHighscoreBtn = document.getElementById("highscore-modal-close-btn");
    okHighscoreBtn = document.getElementById("highscore-modal-ok-btn");
    resetScoresBtn = document.getElementById("reset-scores-btn");
    beginnerScoreEl = document.getElementById("beginner-score");
    intermediateScoreEl = document.getElementById("intermediate-score");
    expertScoreEl = document.getElementById("expert-score");

    highscoreBtn.addEventListener("click", _openHighscoreModal);
    closeHighscoreBtn.addEventListener("click", _closeHighscoreModal);
    okHighscoreBtn.addEventListener("click", _closeHighscoreModal);
    resetScoresBtn.addEventListener("click", _handleResetScoresClick);
    highscoreModalOverlay.addEventListener("click", (e) => {
      if (e.target === highscoreModalOverlay) _closeHighscoreModal();
    });
    const menuHelp = document.getElementById("menu-help");
    highscoreBtn.addEventListener("click", (e) => {
      if (menuHelp) menuHelp.blur();
    });
  }

  function onCustomGame(callback) {
    onCustomGameCallback = callback;
  }

  return {
    init,
    onCustomGame,
  };
})();

export default ui;
