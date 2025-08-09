/**
 * Detects if the current device is a mobile device
 * @returns {boolean} True if device is mobile, false otherwise
 */
export function isMobileDevice() {
  // More comprehensive mobile detection
  return (
    /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    ) ||
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    navigator.msMaxTouchPoints > 0
  );
}

/**
 * Checks if the device is in portrait orientation
 * @returns {boolean} True if portrait, false if landscape
 */
export function isPortraitOrientation() {
  // Use screen dimensions for more reliable detection
  return window.matchMedia("(orientation: portrait)").matches;
}

/**
 * Sets up a canvas for high DPI displays
 * @param {HTMLCanvasElement} canvas - The canvas element to configure
 * @returns {Object} Context and dimensions
 */
export function setupHiDpiCanvas(canvas) {
  // Validate input
  if (!canvas || !(canvas instanceof HTMLCanvasElement)) {
    throw new Error("Invalid canvas element provided");
  }

  // Get device pixel ratio with fallback
  const dpr = window.devicePixelRatio || 1;

  // Get bounding rectangle
  const rect = canvas.getBoundingClientRect();

  // Calculate dimensions
  const width = Math.floor(rect.width);
  const height = Math.floor(rect.height);

  // Set canvas dimensions
  canvas.width = width * dpr;
  canvas.height = height * dpr;

  // Set display dimensions
//  canvas.style.width = `${width}px`;
 // canvas.style.height = `${height}px`;

  // Get context and configure
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Unable to get 2D context from canvas");
  }

  // Configure context for crisp rendering
  ctx.imageSmoothingEnabled = false;
  ctx.webkitImageSmoothingEnabled = false;
  ctx.mozImageSmoothingEnabled = false;
  ctx.msImageSmoothingEnabled = false;

  // Scale context to match device pixel ratio
  ctx.scale(dpr, dpr);

  return {
    ctx,
    width,
    height,
    dpr,
  };
}

/**
 * Creates a debounced function that delays execution
 * @param {Function} func - Function to debounce
 * @param {number} wait - Delay in milliseconds
 * @param {boolean} immediate - Trigger on leading edge instead of trailing
 * @returns {Function} Debounced function
 */
export function debounce(func, wait, immediate = false) {
  // Validate inputs
  if (typeof func !== "function") {
    throw new TypeError("Expected a function");
  }

  if (typeof wait !== "number" || wait < 0) {
    wait = 0;
  }

  let timeoutId;

  return function executedFunction(...args) {
    const callNow = immediate && !timeoutId;

    clearTimeout(timeoutId);

    timeoutId = setTimeout(() => {
      timeoutId = null;
      if (!immediate) {
        func.apply(this, args);
      }
    }, wait);

    if (callNow) {
      func.apply(this, args);
    }
  };
}

/**
 * Creates a throttled function that limits execution rate
 * @param {Function} func - Function to throttle
 * @param {number} limit - Minimum time between calls in milliseconds
 * @returns {Function} Throttled function
 */
export function throttle(func, limit) {
  // Validate inputs
  if (typeof func !== "function") {
    throw new TypeError("Expected a function");
  }

  if (typeof limit !== "number" || limit < 0) {
    limit = 0;
  }

  let inThrottle;
  let lastFunc;
  let lastRan;

  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      lastRan = Date.now();
      inThrottle = true;
    } else {
      clearTimeout(lastFunc);
      lastFunc = setTimeout(() => {
        if (Date.now() - lastRan >= limit) {
          func.apply(this, args);
          lastRan = Date.now();
        }
      }, limit - (Date.now() - lastRan) || 0);
    }
  };
}

/**
 * Detects if the user prefers reduced motion
 * @returns {boolean} True if reduced motion is preferred
 */
export function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Gets the current viewport dimensions
 * @returns {Object} Width and height of viewport
 */
export function getViewportDimensions() {
  return {
    width: Math.max(
      document.documentElement.clientWidth || 0,
      window.innerWidth || 0
    ),
    height: Math.max(
      document.documentElement.clientHeight || 0,
      window.innerHeight || 0
    ),
  };
}
