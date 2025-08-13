const input = (() => {
  // Constants
  const LONG_PRESS_DURATION = 400;
  const DOUBLE_TAP_DELAY = 300;
  const DOUBLE_TAP_TOLERANCE = 10; // Tolerance in pixels for double tap
  const MOUSE_BUTTONS = {
    LEFT: 0,
    MIDDLE: 1,
    RIGHT: 2,
  };

  // State variables
  let canvas = null;
  let faceCanvas = null;
  let config = {
    cellSize: 16,
    gameType: "generic", // 'minesweeper', 'arkanoid', 'solitaire', 'generic'
  };

  const callbacks = {
    onLeftClick: null,
    onRightClick: null,
    onMiddleClick: null,
    onChordClick: null,
    onReset: null,
    onPress: null,
    onRelease: null,
    onMouseMove: null,
    onKeyDown: null,
    onKeyUp: null,
  };

  let isLeftMouseDown = false;
  let isRightMouseDown = false;
  let isMiddleMouseDown = false;

  let touchTimer = null;
  let lastTap = { time: 0, x: -1, y: -1 };
  let longPressOccurred = false;

  /**
   * Calculates coordinates from mouse/touch event
   * @param {Event} event - Mouse or touch event
   * @returns {Object|null} X and Y coordinates or null if invalid
   */
  function _getCoordsFromEvent(event) {
    if (!canvas) return null;

    const source = event.changedTouches
      ? event.changedTouches[0]
      : event.touches
      ? event.touches[0]
      : event;

    const rect = canvas.getBoundingClientRect();
    const x = source.clientX - rect.left;
    const y = source.clientY - rect.top;

    // Check bounds first
    if (x < 0 || x >= rect.width || y < 0 || y >= rect.height) {
      return null;
    }

    return { x, y };
  }

  /**
   * Calculates grid coordinates from mouse/touch event (for grid-based games)
   * @param {Event} event - Mouse or touch event
   * @returns {Object|null} Row and column coordinates or null if invalid
   */
  function _getGridCoordsFromEvent(event) {
    const coords = _getCoordsFromEvent(event);
    if (!coords) return null;

    const c = Math.floor(coords.x / config.cellSize);
    const r = Math.floor(coords.y / config.cellSize);

    return { r, c, x: coords.x, y: coords.y };
  }

  /**
   * Gets appropriate coordinates based on game type
   * @param {Event} event - Mouse or touch event
   * @returns {Object|null} Coordinates object
   */
  function _getCoords(event) {
    if (config.gameType === "minesweeper" || config.gameType === "generic") {
      return _getGridCoordsFromEvent(event);
    }
    return _getCoordsFromEvent(event);
  }

  /**
   * Handles mouse down events
   * @param {MouseEvent} event - Mouse event
   */
  function _handleMouseDown(event) {
    // Prevent middle mouse button default behavior
    if (event.button === MOUSE_BUTTONS.MIDDLE) {
      event.preventDefault();
    }

    // Track button states
    switch (event.button) {
      case MOUSE_BUTTONS.LEFT:
        isLeftMouseDown = true;
        break;
      case MOUSE_BUTTONS.RIGHT:
        isRightMouseDown = true;
        break;
      case MOUSE_BUTTONS.MIDDLE:
        isMiddleMouseDown = true;
        break;
    }

    const pos = _getCoords(event);
    if (pos && callbacks.onPress) {
      callbacks.onPress(pos);
    }
  }

  /**
   * Handles mouse up events
   * @param {MouseEvent} event - Mouse event
   */
  function _handleMouseUp(event) {
    const pos = _getCoords(event);

    // Handle specific button releases
    if (event.button === MOUSE_BUTTONS.MIDDLE && isMiddleMouseDown) {
      isMiddleMouseDown = false;
      if (callbacks.onRelease) {
        callbacks.onRelease();
      }
      if (callbacks.onMiddleClick) {
        callbacks.onMiddleClick(pos);
      }
      return;
    }

    const wasLeftDown = isLeftMouseDown;
    const wasRightDown = isRightMouseDown;

    // Reset button states
    switch (event.button) {
      case MOUSE_BUTTONS.LEFT:
        isLeftMouseDown = false;
        break;
      case MOUSE_BUTTONS.RIGHT:
        isRightMouseDown = false;
        break;
    }

    // Notify release
    if (callbacks.onRelease) {
      callbacks.onRelease();
    }

    // Handle click actions
    if (pos) {
      // Chording (both left and right buttons held)
      if (wasLeftDown && wasRightDown) {
        if (callbacks.onChordClick) callbacks.onChordClick(pos);
      }
      // Left click
      else if (event.button === MOUSE_BUTTONS.LEFT && wasLeftDown) {
        if (callbacks.onLeftClick) callbacks.onLeftClick(pos);
      }
      // Right click
      else if (event.button === MOUSE_BUTTONS.RIGHT && wasRightDown) {
        if (callbacks.onRightClick) callbacks.onRightClick(pos);
      }
    }
  }

  /**
   * Handles mouse move events
   * @param {MouseEvent} event - Mouse event
   */
  function _handleMouseMove(event) {
    if (!isLeftMouseDown && !isRightMouseDown && !isMiddleMouseDown) return;
    event.preventDefault();

    const pos = _getCoords(event);
    if (pos && callbacks.onPress) {
      callbacks.onPress(pos);
    } else if (callbacks.onRelease) {
      callbacks.onRelease();
    }

    // Always notify mouse move for games that need it (like Arkanoid)
    if (callbacks.onMouseMove) {
      const coords = _getCoordsFromEvent(event);
      if (coords) {
        callbacks.onMouseMove(coords);
      }
    }
  }

  /**
   * Handles mouse leave events
   */
  function _handleMouseLeave() {
    if (callbacks.onRelease) {
      callbacks.onRelease();
    }
    isLeftMouseDown = false;
    isRightMouseDown = false;
    isMiddleMouseDown = false;
  }

  /**
   * Handles touch start events
   * @param {TouchEvent} event - Touch event
   */
  function _handleTouchStart(event) {
    event.preventDefault();
    longPressOccurred = false;

    const pos = _getCoords(event);
    if (!pos) return;

    if (callbacks.onPress) {
      callbacks.onPress(pos);
    }

    // Setup long press detection
    touchTimer = setTimeout(() => {
      longPressOccurred = true;
      if (callbacks.onRightClick) {
        callbacks.onRightClick(pos);
      }
      if (callbacks.onRelease) {
        callbacks.onRelease();
      }
    }, LONG_PRESS_DURATION);
  }

  /**
   * Handles touch end events
   * @param {TouchEvent} event - Touch event
   */
  function _handleTouchEnd(event) {
    clearTimeout(touchTimer);

    if (callbacks.onRelease) {
      callbacks.onRelease();
    }

    if (longPressOccurred) {
      return;
    }

    const pos = _getCoords(event);
    if (!pos) return;

    const currentTime = Date.now();
    const isDoubleTap =
      currentTime - lastTap.time < DOUBLE_TAP_DELAY &&
      Math.abs(pos.x - lastTap.x) < DOUBLE_TAP_TOLERANCE &&
      Math.abs(pos.y - lastTap.y) < DOUBLE_TAP_TOLERANCE;

    if (isDoubleTap) {
      if (callbacks.onChordClick) {
        callbacks.onChordClick(pos);
      }
      lastTap = { time: 0, x: -1, y: -1 };
    } else {
      if (callbacks.onLeftClick) {
        callbacks.onLeftClick(pos);
      }
      lastTap = { time: currentTime, x: pos.x, y: pos.y };
    }
  }

  /**
   * Handles touch move events
   * @param {TouchEvent} event - Touch event
   */
  function _handleTouchMove(event) {
    clearTimeout(touchTimer);

    // Notify mouse move for touch drag (useful for games like Arkanoid)
    if (callbacks.onMouseMove) {
      const coords = _getCoordsFromEvent(event);
      if (coords) {
        callbacks.onMouseMove(coords);
      }
    }
  }

  /**
   * Prevents context menu on right-click
   * @param {Event} event - Context menu event
   */
  function _handleContextMenu(event) {
    event.preventDefault();
  }

  /**
   * Handles face button click (for Minesweeper-style reset)
   */
  function _handleFaceClick() {
    if (callbacks.onReset) callbacks.onReset();
  }

  /**
   * Handles keyboard shortcuts
   * @param {KeyboardEvent} event - Keyboard event
   */
  function _handleKeyDown(event) {
    // F2 for reset (common in Minesweeper)
    if (event.key === "F2" && callbacks.onReset) {
      callbacks.onReset();
      return;
    }

    // Notify custom key handlers
    if (callbacks.onKeyDown) {
      callbacks.onKeyDown(event);
    }
  }

  /**
   * Handles keyboard up events
   * @param {KeyboardEvent} event - Keyboard event
   */
  function _handleKeyUp(event) {
    if (callbacks.onKeyUp) {
      callbacks.onKeyUp(event);
    }
  }

  /**
   * Initializes input handlers
   * @param {HTMLCanvasElement} canvasElement - Game canvas
   * @param {HTMLCanvasElement} [faceCanvasElement] - Face canvas (optional)
   * @param {Object} options - Configuration options
   */
  function init(canvasElement, faceCanvasElement, options) {
    canvas = canvasElement;
    faceCanvas = faceCanvasElement;
    config = { ...config, ...options };

    // Clean up existing listeners to prevent duplicates
    _removeEventListeners();

    // Add new listeners
    canvas.addEventListener("mousedown", _handleMouseDown);
    canvas.addEventListener("mouseup", _handleMouseUp);
    canvas.addEventListener("mousemove", _handleMouseMove);
    canvas.addEventListener("mouseleave", _handleMouseLeave);
    canvas.addEventListener("contextmenu", _handleContextMenu);
    canvas.addEventListener("touchstart", _handleTouchStart, {
      passive: false,
    });
    canvas.addEventListener("touchend", _handleTouchEnd);
    canvas.addEventListener("touchmove", _handleTouchMove, {
      passive: false,
    });

    if (faceCanvas) {
      faceCanvas.addEventListener("click", _handleFaceClick);
    }

    window.addEventListener("keydown", _handleKeyDown);
    window.addEventListener("keyup", _handleKeyUp);
  }

  /**
   * Removes all event listeners
   */
  function _removeEventListeners() {
    if (!canvas) return;

    canvas.removeEventListener("mousedown", _handleMouseDown);
    canvas.removeEventListener("mouseup", _handleMouseUp);
    canvas.removeEventListener("mousemove", _handleMouseMove);
    canvas.removeEventListener("mouseleave", _handleMouseLeave);
    canvas.removeEventListener("contextmenu", _handleContextMenu);
    canvas.removeEventListener("touchstart", _handleTouchStart, {
      passive: false,
    });
    canvas.removeEventListener("touchend", _handleTouchEnd);
    canvas.removeEventListener("touchmove", _handleTouchMove, {
      passive: false,
    });

    if (faceCanvas) {
      faceCanvas.removeEventListener("click", _handleFaceClick);
    }

    window.removeEventListener("keydown", _handleKeyDown);
    window.removeEventListener("keyup", _handleKeyUp);
  }

  /**
   * Updates configuration options
   * @param {Object} newOptions - New configuration options
   */
  function updateConfig(newOptions) {
    config = { ...config, ...newOptions };
  }

  /**
   * Cleanup function to remove all event listeners
   */
  function destroy() {
    _removeEventListeners();
    clearTimeout(touchTimer);
    canvas = null;
    faceCanvas = null;
  }

  // Public API
  return {
    /**
     * Initializes the input handler with the given canvas and options.
     * @param {HTMLCanvasElement} canvasElement - The main canvas element for input detection.
     * @param {HTMLCanvasElement} [faceCanvasElement] - An optional secondary canvas (e.g., a reset button).
     * @param {Object} [options] - Configuration options.
     * @param {number} [options.cellSize] - The size of a grid cell for grid-based games.
     * @param {string} [options.gameType] - The type of game to adjust coordinate calculation.
     */
    init,

    /**
     * Updates configuration options
     * @param {Object} newOptions - New configuration options
     */
    updateConfig,

    /**
     * Cleanup function to remove all event listeners
     */
    destroy,

    /**
     * Registers a callback for a left-click or single-tap event.
     * @param {function(object): void} cb - The callback function. Receives a coordinates object {r, c, x, y}.
     */
    onLeftClick: (cb) => {
      callbacks.onLeftClick = cb;
    },

    /**
     * Registers a callback for a right-click or long-press event.
     * @param {function(object): void} cb - The callback function. Receives a coordinates object {r, c, x, y}.
     */
    onRightClick: (cb) => {
      callbacks.onRightClick = cb;
    },

    /**
     * Registers a callback for a middle-click event.
     * @param {function(object): void} cb - The callback function. Receives a coordinates object {r, c, x, y}.
     */
    onMiddleClick: (cb) => {
      callbacks.onMiddleClick = cb;
    },

    /**
     * Registers a callback for a chord-click (both buttons or double tap) event.
     * @param {function(object): void} cb - The callback function. Receives a coordinates object {r, c, x, y}.
     */
    onChordClick: (cb) => {
      callbacks.onChordClick = cb;
    },

    /**
     * Registers a callback for a reset event (F2 key or face click).
     * @param {function(): void} cb - The callback function.
     */
    onReset: (cb) => {
      callbacks.onReset = cb;
    },

    /**
     * Registers a callback for when a press begins (mousedown or touchstart).
     * @param {function(object): void} cb - The callback function. Receives a coordinates object {r, c, x, y}.
     */
    onPress: (cb) => {
      callbacks.onPress = cb;
    },

    /**
     * Registers a callback for when a press ends (mouseup or touchend).
     * @param {function(): void} cb - The callback function.
     */
    onRelease: (cb) => {
      callbacks.onRelease = cb;
    },

    /**
     * Registers a callback for mouse move events.
     * @param {function(object): void} cb - The callback function. Receives a coordinates object {x, y}.
     */
    onMouseMove: (cb) => {
      callbacks.onMouseMove = cb;
    },

    /**
     * Registers a callback for key down events.
     * @param {function(KeyboardEvent): void} cb - The callback function. Receives the KeyboardEvent.
     */
    onKeyDown: (cb) => {
      callbacks.onKeyDown = cb;
    },

    /**
     * Registers a callback for key up events.
     * @param {function(KeyboardEvent): void} cb - The callback function. Receives the KeyboardEvent.
     */
    onKeyUp: (cb) => {
      callbacks.onKeyUp = cb;
    },
  };
})();

export default input;
