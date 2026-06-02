/**
 * __mocks__/styleMock.js
 *
 * Stub for plain CSS imports in tests (non-CSS-Module .css files).
 *
 * When a component does:
 *   import "../styles/RadialMoodMenu.css";
 *
 * …Jest can't interpret raw CSS. This mock makes the import a no-op so the
 * test doesn't crash, without affecting any logic under test.
 *
 * CSS Modules (*.module.css) are handled separately by identity-obj-proxy
 * (configured in jest.config.js), which returns the class name string for
 * every property access so className assertions still work.
 *
 * Wired up via moduleNameMapper in jest.config.js:
 *   "^.+\\.(css|sass|scss)$": "<rootDir>/__mocks__/styleMock.js"
 */
module.exports = {};
