/**
 * jest.setup.js
 *
 * Runs in every test file after the Jest test framework is installed in the
 * environment (i.e. after "describe", "it", "expect" etc. are global).
 *
 * What's imported here:
 *
 * @testing-library/jest-dom
 *   Extends Jest's built-in matchers with DOM-specific assertions, e.g.:
 *     - expect(el).toBeInTheDocument()
 *     - expect(el).toHaveTextContent("hello")
 *     - expect(el).toBeDisabled()
 *   Without this import those matchers would throw "not a function" errors.
 *
 * NOTE: We use require() (CommonJS) here instead of import because:
 *   - jest.config.js is CJS (module.exports = ...)
 *   - Jest processes setup files in the same CJS context
 *   - @testing-library/jest-dom ships a CJS entry point that works reliably
 *     with require() across all Jest versions
 */
require("@testing-library/jest-dom");