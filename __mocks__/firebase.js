/**
 * __mocks__/firebase.js
 *
 * Manual mock for the root firebase.js module (located at @/firebase or
 * ./firebase relative to project root).
 *
 * Why we need this:
 *   - firebase.js reads NEXT_PUBLIC_* env vars at module init time and calls
 *     initializeApp(), which fails in a Jest/jsdom environment because env
 *     vars are not set and the Firebase SDK makes network calls.
 *   - Any component that imports from "@/firebase" would crash without this.
 *
 * Strategy:
 *   Return lightweight jest.fn() stubs for `auth` and `db`.  Any test that
 *   needs specific Firestore behaviour can override individual methods with
 *   jest.spyOn() or jest.fn() inside the test itself.
 *
 * Jest picks this file up automatically because it lives at the same path
 * relative to the root as the real module (__mocks__/firebase.js mirrors
 * firebase.js at the root level).  For non-root modules, use
 * jest.mock('@/firebase') in individual test files instead.
 */

const auth = {
  currentUser: null,
  onAuthStateChanged: jest.fn(() => jest.fn()), // returns unsubscribe fn
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signInWithPopup: jest.fn(),
};

const db = {
  // Stub – individual tests can override these with jest.spyOn
};

module.exports = { auth, db };
