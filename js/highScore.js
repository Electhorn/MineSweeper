// Constants
const HIGH_SCORE_KEY = "winmine_classic_highscores";
const DEFAULT_SCORES = Object.freeze({
  beginner: 999,
  intermediate: 999,
  expert: 999,
});
const VALID_DIFFICULTIES = Object.keys(DEFAULT_SCORES);

// Storage utilities
const storage = {
  /**
   * Safely retrieves item from localStorage
   * @param {string} key - Storage key
   * @returns {string|null} Stored value or null
   */
  getItem(key) {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.warn(`Failed to read from localStorage: ${key}`, error);
      return null;
    }
  },

  /**
   * Safely stores item in localStorage
   * @param {string} key - Storage key
   * @param {string} value - Value to store
   */
  setItem(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error(`Failed to write to localStorage: ${key}`, error);
    }
  },
};

/**
 * Retrieves high scores from storage or returns defaults
 * @returns {Object} High scores object
 */
export function getHighScores() {
  const rawData = storage.getItem(HIGH_SCORE_KEY);

  if (rawData) {
    try {
      const parsed = JSON.parse(rawData);
      if (parsed && typeof parsed === "object") {
        // Merge with defaults to ensure all difficulties are present
        return { ...DEFAULT_SCORES, ...parsed };
      }
    } catch (error) {
      console.warn(
        "High scores data is corrupted. Using default values.",
        error
      );
    }
  }

  return { ...DEFAULT_SCORES };
}

/**
 * Saves high scores to storage
 * @param {Object} scores - Scores to save
 */
function setHighScores(scores) {
  storage.setItem(HIGH_SCORE_KEY, JSON.stringify(scores));
}

/**
 * Updates high score if new time is better
 * @param {string} difficulty - Game difficulty
 * @param {number} time - Time in seconds
 * @returns {boolean} Whether high score was updated
 */
export function checkAndSetHighScore(difficulty, time) {
  // Validate inputs
  if (!VALID_DIFFICULTIES.includes(difficulty)) {
    console.warn(`Invalid difficulty: ${difficulty}`);
    return false;
  }

  if (typeof time !== "number" || time < 0) {
    console.warn(`Invalid time value: ${time}`);
    return false;
  }

  const scores = getHighScores();

  // Update if new time is better (lower)
  if (time < scores[difficulty]) {
    scores[difficulty] = time;
    setHighScores(scores);
    return true;
  }

  return false;
}

/**
 * Resets all high scores to default values
 */
export function resetHighScores() {
  setHighScores({ ...DEFAULT_SCORES });
}

/**
 * Gets a specific high score for a difficulty
 * @param {string} difficulty - Game difficulty
 * @returns {number} High score time
 */
export function getHighScore(difficulty) {
  if (!VALID_DIFFICULTIES.includes(difficulty)) {
    throw new Error(`Invalid difficulty: ${difficulty}`);
  }

  const scores = getHighScores();
  return scores[difficulty];
}

/**
 * Checks if a time qualifies as a high score
 * @param {string} difficulty - Game difficulty
 * @param {number} time - Time in seconds
 * @returns {boolean} Whether time is a high score
 */
export function isHighScore(difficulty, time) {
  if (!VALID_DIFFICULTIES.includes(difficulty)) {
    throw new Error(`Invalid difficulty: ${difficulty}`);
  }

  if (typeof time !== "number" || time < 0) {
    throw new Error(`Invalid time value: ${time}`);
  }

  const scores = getHighScores();
  return time < scores[difficulty];
}
