export function isMobileDevice() {
  return /Mobi|Android/i.test(navigator.userAgent) || "ontouchstart" in window;
}

export function isPortraitOrientation() {
  return window.innerHeight > window.innerWidth;
}

export function setupHiDpiCanvas(canvas) {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();

  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;

  canvas.style.width = `${rect.width}px`;
  canvas.style.height = `${rect.height}px`;

  const ctx = canvas.getContext("2d");

  ctx.imageSmoothingEnabled = false;

  ctx.scale(dpr, dpr);

  return { ctx, width: rect.width, height: rect.height };
}

export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
