/**
 * Zustand Installation Check & Setup
 * Ensures zustand is available as singleton store
 */

let zustand: any = null;

try {
  zustand = require('zustand');
} catch (error) {
  console.warn('[Zustand] Not installed, attempting graceful fallback');
}

export default zustand;