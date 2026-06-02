/**
 * jest.config.js
 *
 * Production-quality Jest configuration for Moody (Next.js 16 + React 19).
 *
 * Strategy: Use next/jest to obtain the official SWC-based transformer that
 * Next.js ships.  This handles:
 *   - ESM → CJS transpilation for all project files
 *   - JSX transformation (React 19 automatic runtime)
 *   - "use client" / "use server" directive stripping
 *   - Automatic moduleNameMapper for @/ path alias (from jsconfig.json)
 *
 * Why next/jest instead of Babel?
 *   next/jest uses the same Rust-based SWC compiler that Next.js uses at
 *   build time, so you get consistent transforms without an extra babel.config
 *   file and without the slower babel-jest dependency.
 */

const nextJest = require("next/jest");

// createJestConfig receives the path to your Next.js app root so it can
// read next.config.mjs and resolve environment-specific settings.
const createJestConfig = nextJest({
  dir: "./",
});

/** @type {import('jest').Config} */
const customConfig = {
  // ── Test environment ────────────────────────────────────────────────────
  // jsdom simulates a browser DOM so React components can render + query
  // the DOM exactly as they would in a real browser.
  testEnvironment: "jest-environment-jsdom",

  // ── Setup files ──────────────────────────────────────────────────────────
  // Runs after the test framework is installed in the environment.
  // Used to import @testing-library/jest-dom custom matchers like
  // toBeInTheDocument(), toHaveTextContent(), etc.
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],

  // ── Module name mapper ───────────────────────────────────────────────────
  // next/jest auto-generates mappers for @/ from jsconfig.json, but we add
  // explicit entries here for:
  //   1. CSS / style imports  → identity-obj-proxy (returns className strings)
  //   2. Static assets        → fileTransformer (returns filename string)
  //   3. SVG files            → fileTransformer
  //   4. @/ alias             → explicit fallback in case next/jest misses it
  moduleNameMapper: {
    // CSS Modules & plain CSS imports – return a Proxy that echoes class names
    "^.+\\.module\\.(css|sass|scss)$": "identity-obj-proxy",
    "^.+\\.(css|sass|scss)$": "<rootDir>/__mocks__/styleMock.js",

    // Image / font / static asset imports
    "^.+\\.(png|jpg|jpeg|gif|webp|avif|ico|bmp|svg|woff|woff2|eot|ttf|otf)$":
      "<rootDir>/__mocks__/fileMock.js",

    // @/ alias → project root (next/jest sets this from jsconfig.json, but we
    // keep an explicit entry as a safety net so it always resolves correctly).
    "^@/(.*)$": "<rootDir>/$1",
  },

  // ── Test file patterns ───────────────────────────────────────────────────
  // Looks in __tests__/ and for any *.test.js / *.spec.js next to source files.
  testMatch: [
    "**/__tests__/**/*.[jt]s?(x)",
    "**/?(*.)+(spec|test).[jt]s?(x)",
  ],

  // Exclude Next.js build output and node_modules from test discovery.
  testPathIgnorePatterns: ["<rootDir>/.next/", "<rootDir>/node_modules/"],

  // ── Transform ignore ─────────────────────────────────────────────────────
  // By default next/jest sets transformIgnorePatterns to ignore node_modules,
  // but several packages ship ESM-only code.  We whitelist those so the SWC
  // transformer can process them.
  transformIgnorePatterns: [
    "/node_modules/(?!(" +
      // ESM-only packages used by Moody that must be transformed:
      "lucide-react|" +
      "@tiptap|" +
      "tiptap-markdown|" +
      "react-markdown|" +
      "remark.*|" +
      "rehype.*|" +
      "unified|" +
      "unist.*|" +
      "vfile.*|" +
      "micromark.*|" +
      "decode-named-character-reference|" +
      "character-entities|" +
      "hast.*|" +
      "mdast.*|" +
      "bail|" +
      "is-plain-obj|" +
      "trough|" +
      "extend|" +
      "@gsap|" +
      "gsap|" +
      "ogl" +
      ")/)",
    "^.+\\.module\\.(css|sass|scss)$",
  ],

  // ── Module file extensions ───────────────────────────────────────────────
  moduleFileExtensions: ["js", "jsx", "ts", "tsx", "json", "node"],

  // ── Coverage ─────────────────────────────────────────────────────────────
  // Run with: npm test -- --coverage
  collectCoverageFrom: [
    "utils/**/*.{js,jsx}",
    "lib/**/*.{js,jsx}",
    "hooks/**/*.{js,jsx}",
    "components/**/*.{js,jsx}",
    "!**/__tests__/**",
    "!**/*.test.{js,jsx}",
    "!**/node_modules/**",
    "!**/.next/**",
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],

  // ── Misc ─────────────────────────────────────────────────────────────────
  // Clear mock state between every test so tests are fully isolated.
  clearMocks: true,
  // Restore any spies/mocks that were implemented using jest.spyOn.
  restoreMocks: true,
};

// createJestConfig merges Next.js defaults (SWC transform, env vars, etc.)
// with our custom config.  Async because next/jest may need to load
// next.config.mjs asynchronously.
module.exports = createJestConfig(customConfig);