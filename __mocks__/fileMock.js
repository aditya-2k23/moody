/**
 * __mocks__/fileMock.js
 *
 * Stub for static file imports in tests.
 *
 * When Jest encounters an import like:
 *   import logo from './logo.svg'
 *   import hero from './hero.png'
 *
 * …it would normally fail because Node.js can't parse binary/SVG/font files.
 * This mock returns a simple string so the import resolves without error and
 * the test can still assert on the string value if needed.
 *
 * Wired up via moduleNameMapper in jest.config.js:
 *   "^.+\\.(png|jpg|svg|...)$": "<rootDir>/__mocks__/fileMock.js"
 */
module.exports = "test-file-stub";
