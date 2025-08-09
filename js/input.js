const input = (() => {
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
  const LONG_PRESS_DURATION = 400;
  let lastTap = { time: 0, r: -1, c: -1 };
  const DOUBLE_TAP_DELAY = 300;
  let longPressOccurred = false;

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

    const c = Math.floor(x / config.cellSize);
    const r = Math.floor(y / config.cellSize);

    if (x < 0 || x > rect.width || y < 0 || y > rect.height) {
      return null;
    }

    return { r, c };
  }

  function _handleMouseDown(event) {
    if (event.button === 1) {
      event.preventDefault();
    }
    if (event.button === 0) isLeftMouseDown = true;
    if (event.button === 2) isRightMouseDown = true;

    if (event.button === 1) {
      isLeftMouseDown = true;
      isRightMouseDown = true;
    }

    const pos = _getCoordsFromEvent(event);
    if (pos && callbacks.onPress) {
      callbacks.onPress(pos.r, pos.c);
    }
  }

  function _handleMouseUp(event) {
    const pos = _getCoordsFromEvent(event);

    if (callbacks.onRelease) {
      callbacks.onRelease();
    }

    if (!pos) {
      isLeftMouseDown = false;
      isRightMouseDown = false;
      return;
    }

    const wasLeftDown = isLeftMouseDown;
    const wasRightDown = isRightMouseDown;

    if (event.button === 0) isLeftMouseDown = false;
    if (event.button === 2) isRightMouseDown = false;
    if (event.button === 1) {
      isLeftMouseDown = false;
      isRightMouseDown = false;
    }

    if ((wasLeftDown && wasRightDown) || event.button === 1) {
      if (callbacks.onChordClick) callbacks.onChordClick(pos.r, pos.c);
    } else if (event.button === 0 && wasLeftDown) {
      if (callbacks.onLeftClick) callbacks.onLeftClick(pos.r, pos.c);
    } else if (event.button === 2 && wasRightDown) {
      if (callbacks.onRightClick) callbacks.onRightClick(pos.r, pos.c);
    }
  }

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

  function _handleMouseLeave() {
    if (callbacks.onRelease) {
      callbacks.onRelease();
    }
    isLeftMouseDown = false;
    isRightMouseDown = false;
  }

  function _handleTouchStart(event) {
    event.preventDefault();
    longPressOccurred = false;

    const pos = _getCoordsFromEvent(event);
    if (!pos) return;

    if (callbacks.onPress) {
      callbacks.onPress(pos.r, pos.c);
    }

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

    const currentTime = new Date().getTime();
    if (
      currentTime - lastTap.time < DOUBLE_TAP_DELAY &&
      pos.r === lastTap.r &&
      pos.c === lastTap.c
    ) {
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

  function _handleTouchMove(event) {
    clearTimeout(touchTimer);
  }

  function _handleContextMenu(event) {
    event.preventDefault();
  }

  function _handleFaceClick() {
    if (callbacks.onReset) callbacks.onReset();
  }

  function _handleKeyDown(event) {
    if (event.key === "F2") {
      if (callbacks.onReset) callbacks.onReset();
    }
  }

  function init(canvasElement, faceCanvasElement, options) {
    canvas = canvasElement;
    faceCanvas = faceCanvasElement;
    config = { ...config, ...options };

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

  function updateConfig(newOptions) {
    config = { ...config, ...newOptions };
  }

  return {
    init,
    updateConfig,
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
