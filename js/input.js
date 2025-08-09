const input = (() => {
  // Constants
  const LONG_PRESS_DURATION = 400;
  const DOUBLE_TAP_DELAY = 300;
  const MOUSE_BUTTONS = {
    LEFT: 0,
    MIDDLE: 1,
    RIGHT: 2,
  };

  // State variables
  let canvas = null;
  let faceCanvas = null;
  let config = { cellSize: 16 };

  const callbacks = {
    onLeftClick: null,
    onRightClick: null,
    onChordClick: null,
    onReset: null,
    onPress: null,
    onRelease: null,
  };

  let isLeftMouseDown = false;
  let isRightMouseDown = false;
  let isMouseOverCanvas = false;

  let touchTimer = null;
  let lastTap = { time: 0, r: -1, c: -1 };
  let longPressOccurred = false;

  /**
   * Calculates grid coordinates from mouse/touch event
   * @param {Event} event - Mouse or touch event
   * @returns {Object|null} Row and column coordinates or null if invalid
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

    const c = Math.floor(x / config.cellSize);
    const r = Math.floor(y / config.cellSize);

    return { r, c };
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
        isLeftMouseDown = true;
        isRightMouseDown = true;
        break;
    }

    const pos = _getCoordsFromEvent(event);
    if (pos && callbacks.onPress) {
      callbacks.onPress(pos.r, pos.c);
    }
  }

  /**
   * Handles mouse up events
   * @param {MouseEvent} event - Mouse event
   */
  function _handleMouseUp(event) {
    const pos = _getCoordsFromEvent(event);
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
      case MOUSE_BUTTONS.MIDDLE:
        isLeftMouseDown = false;
        isRightMouseDown = false;
        break;
    }

    // Notify release
    if (callbacks.onRelease) {
      callbacks.onRelease();
    }

    // Handle click actions
    if (pos) {
      if (
        (wasLeftDown && wasRightDown) ||
        event.button === MOUSE_BUTTONS.MIDDLE
      ) {
        if (callbacks.onChordClick) callbacks.onChordClick(pos.r, pos.c);
      } else if (event.button === MOUSE_BUTTONS.LEFT && wasLeftDown) {
        if (callbacks.onLeftClick) callbacks.onLeftClick(pos.r, pos.c);
      } else if (event.button === MOUSE_BUTTONS.RIGHT && wasRightDown) {
        if (callbacks.onRightClick) callbacks.onRightClick(pos.r, pos.c);
      }
    }
  }

  /**
   * Handles mouse move events
   * @param {MouseEvent} event - Mouse event
   */
  function _handleMouseMove(event) {
    if (!isLeftMouseDown && !isRightMouseDown) return;
    event.preventDefault();

    const pos = _getCoordsFromEvent(event);
    if (pos && callbacks.onPress) {
      callbacks.onPress(pos.r, pos.c);
    } else if (callbacks.onRelease) {
      callbacks.onRelease();
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
  }

  /**
   * Handles touch start events
   * @param {TouchEvent} event - Touch event
   */
  function _handleTouchStart(event) {
    event.preventDefault();
    longPressOccurred = false;

    const pos = _getCoordsFromEvent(event);
    if (!pos) return;

    if (callbacks.onPress) {
      callbacks.onPress(pos.r, pos.c);
    }

    // Setup long press detection
    touchTimer = setTimeout(() => {
      longPressOccurred = true;
      if (callbacks.onRightClick) {
        callbacks.onRightClick(pos.r, pos.c);
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

    const pos = _getCoordsFromEvent(event);
    if (!pos) return;

    const currentTime = Date.now();
    const isDoubleTap =
      currentTime - lastTap.time < DOUBLE_TAP_DELAY &&
      pos.r === lastTap.r &&
      pos.c === lastTap.c;

    if (isDoubleTap) {
      if (callbacks.onChordClick) {
        callbacks.onChordClick(pos.r, pos.c);
      }
      lastTap = { time: 0, r: -1, c: -1 };
    } else {
      if (callbacks.onLeftClick) {
        callbacks.onLeftClick(pos.r, pos.c);
      }
      lastTap = { time: currentTime, r: pos.r, c: pos.c };
    }
  }

  /**
   * Handles touch move events
   * @param {TouchEvent} event - Touch event
   */
  function _handleTouchMove(event) {
    clearTimeout(touchTimer);
  }

  /**
   * Prevents context menu on right-click
   * @param {Event} event - Context menu event
   */
  function _handleContextMenu(event) {
    event.preventDefault();
  }

  /**
   * Handles face button click
   */
  function _handleFaceClick() {
    if (callbacks.onReset) callbacks.onReset();
  }

  /**
   * Handles keyboard shortcuts
   * @param {KeyboardEvent} event - Keyboard event
   */
  function _handleKeyDown(event) {
    if (event.key === "F2" && callbacks.onReset) {
      callbacks.onReset();
    }
  }

  /**
   * Initializes input handlers
   * @param {HTMLCanvasElement} canvasElement - Game canvas
   * @param {HTMLCanvasElement} faceCanvasElement - Face canvas
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
    canvas.addEventListener("touchmove", _handleTouchMove);
    faceCanvas.addEventListener("click", _handleFaceClick);
    window.addEventListener("keydown", _handleKeyDown);
  }

  /**
   * Removes all event listeners
   */
  function _removeEventListeners() {
    if (!canvas || !faceCanvas) return;

    canvas.removeEventListener("mousedown", _handleMouseDown);
    canvas.removeEventListener("mouseup", _handleMouseUp);
    canvas.removeEventListener("mousemove", _handleMouseMove);
    canvas.removeEventListener("mouseleave", _handleMouseLeave);
    canvas.removeEventListener("contextmenu", _handleContextMenu);
    canvas.removeEventListener("touchstart", _handleTouchStart, {
      passive: false,
    });
    canvas.removeEventListener("touchend", _handleTouchEnd);
    canvas.removeEventListener("touchmove", _handleTouchMove);
    faceCanvas.removeEventListener("click", _handleFaceClick);
    window.removeEventListener("keydown", _handleKeyDown);
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
    init,
    updateConfig,
    destroy,
    onLeftClick: (cb) => {
      callbacks.onLeftClick = cb;
    },
    onRightClick: (cb) => {
      callbacks.onRightClick = cb;
    },
    onChordClick: (cb) => {
      callbacks.onChordClick = cb;
    },
    onReset: (cb) => {
      callbacks.onReset = cb;
    },
    onPress: (cb) => {
      callbacks.onPress = cb;
    },
    onRelease: (cb) => {
      callbacks.onRelease = cb;
    },
  };
})();

export default input;
