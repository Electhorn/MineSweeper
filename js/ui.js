import { getHighScores, resetHighScores } from "./highScore.js";

export class DigitalDisplay {
  constructor(canvasId, setupHiDpiCanvas, options = {}) {
    const canvas = document.getElementById(canvasId);
    this.canvas = canvas;
    if (!canvas) {
      console.error(`Canvas with ID "${canvasId}" not found.`);
      return;
    }
    this.setupHiDpiCanvas = setupHiDpiCanvas;

    const { ctx, width, height } = this.setupHiDpiCanvas(this.canvas);
    this.ctx = ctx;
    this.width = width;
    this.height = height;

    // Enhanced state management
    this.currentValue = 0;
    this.targetValue = 0;
    this.animationFrame = null;
    this.isAnimating = false;

    // Flexible configuration with defaults
    this.config = {
      digitCount: options.digitCount || 3,
      digitWidth: options.digitWidth || 13,
      digitHeight: options.digitHeight || 23,
      segmentWidth: options.segmentWidth || 9,
      segmentHeight: options.segmentHeight || 9,
      segmentThickness: options.segmentThickness || 2,
      digitSpacing: options.digitSpacing || 3,
      colorOn: options.colorOn || "#FF0000",
      colorOff: options.colorOff || "#300000",
      bgColor: options.bgColor || "black",
      // New animation options
      animationSpeed: options.animationSpeed || 150, // milliseconds
      enableAnimation: options.enableAnimation !== false,
      // New display options
      leadingZeros: options.leadingZeros || false,
      blinkOnUpdate: options.blinkOnUpdate || false,
      blinkDuration: options.blinkDuration || 200,
      // Enhanced styling
      segmentGap: options.segmentGap || 1,
      cornerRadius: options.cornerRadius || 0,
      glowEffect: options.glowEffect || true,
      glowColor: options.glowColor || "#FF4444",
      glowBlur: options.glowBlur || 6,
    };

    // Blink state management
    this.blinkState = {
      isBlinking: false,
      startTime: 0,
      visible: true,
    };

    // Define segment patterns for digits 0-9 and special characters
    this.segmentMap = {
      0: [true, true, true, true, true, true, false],
      1: [false, true, true, false, false, false, false],
      2: [true, true, false, true, true, false, true],
      3: [true, true, true, true, false, false, true],
      4: [false, true, true, false, false, true, true],
      5: [true, false, true, true, false, true, true],
      6: [true, false, true, true, true, true, true],
      7: [true, true, true, false, false, false, false],
      8: [true, true, true, true, true, true, true],
      9: [true, true, true, true, false, true, true],
      // Special characters
      "-": [false, false, false, false, false, false, true], // minus sign
      " ": [false, false, false, false, false, false, false], // blank
      E: [true, false, false, true, true, true, true], // Error
      r: [false, false, false, false, true, false, true], // error continuation
    };

    this._defineSegmentPaths();

    // Performance optimization: cache commonly used values
    this._segmentCache = new Map();
    this._lastDrawnValue = null;
  }

  /**
   * Resize the display and maintain current state
   * This method handles window resize events gracefully
   */
  resize() {
  

  const computedStyle = window.getComputedStyle(this.canvas);
  const originalWidth = parseInt(computedStyle.width, 10) || this.canvas.clientWidth;
  const originalHeight = parseInt(computedStyle.height, 10) || this.canvas.clientHeight;
  
  this.canvas.style.width = originalWidth + 'px';
  this.canvas.style.height = originalHeight + 'px';
  this.canvas.width = originalWidth;
  this.canvas.height = originalHeight;
  
  
  const { ctx, width, height } = this.setupHiDpiCanvas(this.canvas);
  this.ctx = ctx;
  this.width = width;
  this.height = height;

  this._segmentCache.clear();
  this._lastDrawnValue = null;

  this.display(this.currentValue);
}

  /**
   * Define the geometric paths for each seven-segment display segment
   * This creates the visual structure of each digit
   */
  _defineSegmentPaths() {
    const w = this.config.digitWidth;
    const h = this.config.digitHeight;
    const t = this.config.segmentThickness;
    const t2 = t / 2;
    const gap = this.config.segmentGap;

    // Define seven segments (A-G) with optional corner radius support
    this.paths = {
      // Top horizontal segment (A)
      A: this._createSegmentPath([
        [t + gap, t2],
        [w - t - gap, t2],
        [w - t - t2 - gap, t + t2],
        [t + t2 + gap, t + t2],
      ]),

      // Top-right vertical segment (B)
      B: this._createSegmentPath([
        [w - t2, t + gap],
        [w - t2, h / 2 - gap],
        [w - t - t2, h / 2 - t2 - gap],
        [w - t - t2, t + t2 + gap],
      ]),

      // Bottom-right vertical segment (C)
      C: this._createSegmentPath([
        [w - t - t2, h / 2 + t2 + gap],
        [w - t - t2, h - t - t2 - gap],
        [w - t2, h - t - gap],
        [w - t2, h / 2 + gap],
      ]),

      // Bottom horizontal segment (D)
      D: this._createSegmentPath([
        [t + t2 + gap, h - t - t2],
        [w - t - t2 - gap, h - t - t2],
        [w - t - gap, h - t2],
        [t + gap, h - t2],
      ]),

      // Bottom-left vertical segment (E)
      E: this._createSegmentPath([
        [t2, h / 2 + gap],
        [t2, h - t - gap],
        [t + t2, h - t - t2 - gap],
        [t + t2, h / 2 + t2 + gap],
      ]),

      // Top-left vertical segment (F)
      F: this._createSegmentPath([
        [t + t2, t + t2 + gap],
        [t + t2, h / 2 - t2 - gap],
        [t2, h / 2 - gap],
        [t2, t + gap],
      ]),

      // Middle horizontal segment (G)
      G: this._createSegmentPath([
        [t + t2 + gap, h / 2 - t2],
        [w - t - t2 - gap, h / 2 - t2],
        [w - t - gap, h / 2],
        [w - t - t2 - gap, h / 2 + t2],
        [t + t2 + gap, h / 2 + t2],
        [t + gap, h / 2],
      ]),
    };
  }

  /**
   * Create a segment path with optional corner radius
   * This allows for more sophisticated visual styling
   */
  _createSegmentPath(points) {
    if (this.config.cornerRadius <= 0) {
      return points; // Return original sharp corners
    }

    // For now, return original points. Corner radius implementation
    // would require more complex path calculations with bezier curves
    return points;
  }

  /**
   * Draw a single segment with enhanced visual effects
   */
  _drawSegment(path, color, offsetX, offsetY) {
    const ctx = this.ctx;

    // Apply glow effect if enabled
    if (this.config.glowEffect && color === this.config.colorOn) {
      ctx.shadowColor = this.config.glowColor;
      ctx.shadowBlur = this.config.glowBlur;
    }

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(offsetX + path[0][0], offsetY + path[0][1]);

    for (let i = 1; i < path.length; i++) {
      ctx.lineTo(offsetX + path[i][0], offsetY + path[i][1]);
    }

    ctx.closePath();
    ctx.fill();

    // Reset shadow
    if (this.config.glowEffect) {
      ctx.shadowBlur = 0;
    }
  }

  /**
   * Draw a single digit at the specified position
   * Enhanced with better error handling and visual effects
   */
  _drawDigit(character, position) {
    const totalDigitsWidth =
      this.config.digitWidth * this.config.digitCount +
      this.config.digitSpacing * (this.config.digitCount - 1);
    const initialOffsetX = (this.width - totalDigitsWidth) / 2;
    const offsetY = (this.height - this.config.digitHeight) / 2;

    const digitOffsetX =
      initialOffsetX +
      position * (this.config.digitWidth + this.config.digitSpacing);

    // Get segment pattern for this character
    const activeSegments = this.segmentMap[character] || this.segmentMap[" "];
    const segmentKeys = ["A", "B", "C", "D", "E", "F", "G"];

    // Draw all segments in "off" state first (background segments)
    segmentKeys.forEach((key) =>
      this._drawSegment(
        this.paths[key],
        this.config.colorOff,
        digitOffsetX,
        offsetY
      )
    );

    // Draw active segments in "on" state
    if (this.blinkState.visible || !this.blinkState.isBlinking) {
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
  }

  /**
   * Convert a number to an array of characters for display
   * Handles various formatting options and special cases
   */
  _numberToCharacters(number) {
    if (number === null || number === undefined) {
      return ["E", "r", "r"]; // Error display
    }

    let chars = [];

    if (number < 0) {
      // Handle negative numbers
      const absNumber = Math.abs(number);
      const maxNegative = Math.pow(10, this.config.digitCount - 1) - 1;

      if (absNumber > maxNegative) {
        // Number too large for display
        chars = new Array(this.config.digitCount).fill("-");
      } else {
        const numStr = absNumber
          .toString()
          .padStart(this.config.digitCount - 1, "0");
        chars = ["-", ...numStr.split("").map(Number)];
      }
    } else {
      // Handle positive numbers
      const maxPositive = Math.pow(10, this.config.digitCount) - 1;

      if (number > maxPositive) {
        // Number too large for display - show all 9s or error
        chars = new Array(this.config.digitCount).fill(9);
      } else {
        let numStr;
        if (this.config.leadingZeros) {
          numStr = number.toString().padStart(this.config.digitCount, "0");
        } else {
          numStr = number.toString();
          // Pad with spaces on the left if needed
          while (numStr.length < this.config.digitCount) {
            numStr = " " + numStr;
          }
        }
        chars = numStr
          .split("")
          .map((char) => (isNaN(char) ? char : Number(char)));
      }
    }

    return chars.slice(-this.config.digitCount); // Ensure correct length
  }

  /**
   * Handle blink animation logic
   */
  _updateBlinkState() {
    if (!this.blinkState.isBlinking) return false;

    const elapsed = Date.now() - this.blinkState.startTime;

    if (elapsed >= this.config.blinkDuration) {
      this.blinkState.isBlinking = false;
      this.blinkState.visible = true;
      return false; // Animation complete
    }

    // Toggle visibility at regular intervals during blink
    const blinkInterval = this.config.blinkDuration / 6; // Blink 3 times
    this.blinkState.visible = Math.floor(elapsed / blinkInterval) % 2 === 0;

    return true; // Animation continues
  }

  /**
   * Start a blink animation
   */
  _startBlink() {
    if (!this.config.blinkOnUpdate) return;

    this.blinkState.isBlinking = true;
    this.blinkState.startTime = Date.now();
    this.blinkState.visible = false;

    // Schedule re-render during blink
    const blinkUpdate = () => {
      if (this._updateBlinkState()) {
        this._render();
        requestAnimationFrame(blinkUpdate);
      } else {
        this._render(); // Final render when blink ends
      }
    };
    requestAnimationFrame(blinkUpdate);
  }

  /**
   * Animate value change from current to target value
   * Provides smooth visual transitions between numbers
   */
  _animateToTarget() {
    if (
      !this.config.enableAnimation ||
      this.currentValue === this.targetValue
    ) {
      this.currentValue = this.targetValue;
      this.isAnimating = false;
      this._render();
      return;
    }

    this.isAnimating = true;
    const startValue = this.currentValue;
    const startTime = Date.now();
    const duration = this.config.animationSpeed;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Use easing function for smoother animation
      const easedProgress = 1 - Math.pow(1 - progress, 3); // Ease-out cubic

      this.currentValue = Math.round(
        startValue + (this.targetValue - startValue) * easedProgress
      );

      this._render();

      if (progress < 1) {
        this.animationFrame = requestAnimationFrame(animate);
      } else {
        this.currentValue = this.targetValue;
        this.isAnimating = false;
        this._render();
      }
    };

    this.animationFrame = requestAnimationFrame(animate);
  }

  /**
   * Internal render method that handles the actual drawing
   * Separated from display() to allow for animation frames
   */
  _render() {
    // Skip rendering if value hasn't changed and no animation is active
    if (
      this.currentValue === this._lastDrawnValue &&
      !this.blinkState.isBlinking &&
      !this.isAnimating
    ) {
      return;
    }

    this.ctx.fillStyle = this.config.bgColor;
    this.ctx.fillRect(0, 0, this.width, this.height);

    const characters = this._numberToCharacters(this.currentValue);

    for (let i = 0; i < characters.length; i++) {
      this._drawDigit(characters[i], i);
    }

    this._lastDrawnValue = this.currentValue;
  }

  /**
   * Public method to display a number with optional animation
   * This is the main interface for updating the display
   */
  display(number, immediate = false) {
    // Cancel any existing animation
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }

    this.targetValue = number;

    if (immediate || !this.config.enableAnimation) {
      this.currentValue = this.targetValue;
      this._render();
    } else {
      // Start blink if value is changing
      if (this.currentValue !== this.targetValue) {
        this._startBlink();
      }

      // Start animation after a brief delay to allow blink to be visible
      setTimeout(
        () => {
          this._animateToTarget();
        },
        this.config.blinkOnUpdate ? 50 : 0
      );
    }
  }

  /**
   * Update display configuration at runtime
   * Allows dynamic customization without recreating the display
   */
  updateConfig(newConfig) {
    const oldConfig = { ...this.config };
    this.config = { ...this.config, ...newConfig };

    // If visual properties changed, regenerate paths and clear cache
    if (this._visualPropertiesChanged(oldConfig, this.config)) {
      this._defineSegmentPaths();
      this._segmentCache.clear();
      this._lastDrawnValue = null;
    }

    // Re-render with new configuration
    this._render();
  }

  /**
   * Check if visual properties that require path regeneration have changed
   */
  _visualPropertiesChanged(oldConfig, newConfig) {
    const visualProps = [
      "digitWidth",
      "digitHeight",
      "segmentThickness",
      "segmentGap",
      "cornerRadius",
    ];

    return visualProps.some((prop) => oldConfig[prop] !== newConfig[prop]);
  }

  /**
   * Force immediate update without animation
   * Useful for initialization or when animation is not desired
   */
  forceUpdate(number = this.currentValue) {
    this.display(number, true);
  }

  /**
   * Get the current displayed value
   * Useful for external code that needs to know what's currently shown
   */
  getCurrentValue() {
    return this.currentValue;
  }

  /**
   * Get the target value (what the display is animating towards)
   */
  getTargetValue() {
    return this.targetValue;
  }

  /**
   * Check if the display is currently animating
   */
  isAnimating() {
    return this.isAnimating;
  }

  /**
   * Cleanup method to cancel animations and free resources
   * Should be called when the display is no longer needed
   */
  destroy() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    this._segmentCache.clear();
  }
}

// UI Module
const ui = (() => {
  // Constants for game configuration validation
  const MIN_HEIGHT = 9;
  const MAX_HEIGHT = 24;
  const MIN_WIDTH = 9;
  const MAX_WIDTH = 30;
  const MIN_MINES = 10;

  // Callback storage
  let onCustomGameCallback = null;

  // DOM elements cache
  let customModalOverlay, customBtn, closeBtn, cancelBtn, okBtn;
  let heightInput, widthInput, minesInput;

  let highscoreModalOverlay,
    highscoreBtn,
    closeHighscoreBtn,
    okHighscoreBtn,
    resetScoresBtn;
  let beginnerScoreEl, intermediateScoreEl, expertScoreEl;

  /**
   * Opens the custom game modal
   */
  function _openModal() {
    if (!customModalOverlay) return;
    customModalOverlay.classList.remove("hidden");
  }

  /**
   * Closes the custom game modal
   */
  function _closeModal() {
    if (!customModalOverlay) return;
    customModalOverlay.classList.add("hidden");
  }

  /**
   * Shows an error message
   * @param {string} message - Error message to display
   */
  function _showError(message) {
    // TODO: Implement a better UI for showing errors in the modal
    alert(message);
  }

  /**
   * Validates custom game configuration
   * @param {number} height - Board height
   * @param {number} width - Board width
   * @param {number} mines - Number of mines
   * @returns {Array} Array of error messages
   */
  function _validateCustomConfig(height, width, mines) {
    const errors = [];

    if (isNaN(height) || height < MIN_HEIGHT || height > MAX_HEIGHT) {
      errors.push(`Height must be between ${MIN_HEIGHT} and ${MAX_HEIGHT}`);
    }

    if (isNaN(width) || width < MIN_WIDTH || width > MAX_WIDTH) {
      errors.push(`Width must be between ${MIN_WIDTH} and ${MAX_WIDTH}`);
    }

    if (isNaN(mines) || mines < MIN_MINES || mines > height * width - 9) {
      errors.push(
        `Mines must be between ${MIN_MINES} and ${height * width - 9}`
      );
    }

    return errors;
  }

  /**
   * Handles OK button click in custom game modal
   */
  function _handleOkClick() {
    if (!heightInput || !widthInput || !minesInput) {
      console.error("Input elements not found");
      return;
    }

    const height = parseInt(heightInput.value, 10);
    const width = parseInt(widthInput.value, 10);
    const mines = parseInt(minesInput.value, 10);

    const errors = _validateCustomConfig(height, width, mines);
    if (errors.length > 0) {
      _showError(errors.join("\n"));
      return;
    }

    if (typeof onCustomGameCallback !== "function") {
      console.error("Custom game callback not set");
      return;
    }

    const customConfig = { rows: height, cols: width, mineCount: mines };
    onCustomGameCallback(customConfig);
    _closeModal();
  }

  /**
   * Populates highscore modal with current scores
   */
  function _populateHighscoreModal() {
    if (!beginnerScoreEl || !intermediateScoreEl || !expertScoreEl) return;

    const scores = getHighScores();
    beginnerScoreEl.textContent =
      scores.beginner === 999 ? "---" : scores.beginner;
    intermediateScoreEl.textContent =
      scores.intermediate === 999 ? "---" : scores.intermediate;
    expertScoreEl.textContent = scores.expert === 999 ? "---" : scores.expert;
  }

  /**
   * Opens the highscore modal
   */
  function _openHighscoreModal() {
    _populateHighscoreModal();
    if (highscoreModalOverlay) {
      highscoreModalOverlay.classList.remove("hidden");
    }
  }

  /**
   * Closes the highscore modal
   */
  function _closeHighscoreModal() {
    if (highscoreModalOverlay) {
      highscoreModalOverlay.classList.add("hidden");
    }
  }

  /**
   * Handles reset scores button click
   */
  function _handleResetScoresClick() {
    if (confirm("Are you sure you want to reset all high scores?")) {
      resetHighScores();
      _populateHighscoreModal();
    }
  }

  /**
   * Initializes UI components and event listeners
   */
  function init() {
    // Initialize custom game modal elements
    customModalOverlay = document.getElementById("custom-modal-overlay");
    customBtn = document.getElementById("custom-difficulty-btn");
    closeBtn = document.getElementById("modal-close-btn");
    cancelBtn = document.getElementById("modal-cancel-btn");
    okBtn = document.getElementById("modal-ok-btn");
    heightInput = document.getElementById("custom-height");
    widthInput = document.getElementById("custom-width");
    minesInput = document.getElementById("custom-mines");

    // Add event listeners for custom game modal
    if (customBtn) customBtn.addEventListener("click", _openModal);
    if (closeBtn) closeBtn.addEventListener("click", _closeModal);
    if (cancelBtn) cancelBtn.addEventListener("click", _closeModal);
    if (okBtn) okBtn.addEventListener("click", _handleOkClick);

    if (customModalOverlay) {
      customModalOverlay.addEventListener("click", (e) => {
        if (e.target === customModalOverlay) _closeModal();
      });
    }

    // Initialize highscore modal elements
    highscoreModalOverlay = document.getElementById("highscore-modal-overlay");
    highscoreBtn = document.getElementById("highscore-btn");
    closeHighscoreBtn = document.getElementById("highscore-modal-close-btn");
    okHighscoreBtn = document.getElementById("highscore-modal-ok-btn");
    resetScoresBtn = document.getElementById("reset-scores-btn");
    beginnerScoreEl = document.getElementById("beginner-score");
    intermediateScoreEl = document.getElementById("intermediate-score");
    expertScoreEl = document.getElementById("expert-score");

    // Add event listeners for highscore modal
    if (highscoreBtn)
      highscoreBtn.addEventListener("click", _openHighscoreModal);
    if (closeHighscoreBtn)
      closeHighscoreBtn.addEventListener("click", _closeHighscoreModal);
    if (okHighscoreBtn)
      okHighscoreBtn.addEventListener("click", _closeHighscoreModal);
    if (resetScoresBtn)
      resetScoresBtn.addEventListener("click", _handleResetScoresClick);

    if (highscoreModalOverlay) {
      highscoreModalOverlay.addEventListener("click", (e) => {
        if (e.target === highscoreModalOverlay) _closeHighscoreModal();
      });
    }

    // Additional event listener for menu help blur
    const menuHelp = document.getElementById("menu-help");
    if (highscoreBtn && menuHelp) {
      highscoreBtn.addEventListener("click", () => {
        menuHelp.blur();
      });
    }
  }

  /**
   * Sets the callback for custom game configuration
   * @param {Function} callback - Function to call with custom config
   */
  function onCustomGame(callback) {
    if (typeof callback === "function") {
      onCustomGameCallback = callback;
    } else {
      console.error("Invalid callback provided to onCustomGame");
    }
  }

  // Public API
  return {
    init,
    onCustomGame,
  };
})();

export default ui;
