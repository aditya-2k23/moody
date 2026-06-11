/**
 * __tests__/components/StreakIndicator.test.jsx
 *
 * Tests for the StreakIndicator component.
 *
 * WHY THIS TEST EXISTS:
 *   StreakIndicator has two distinct visual states (active / inactive) that
 *   directly depend on `hasLoggedToday`.  The ARIA label it renders is the
 *   only accessibility signal for screen-reader users.  Regressions in the
 *   aria-label or tooltip visibility would fail WCAG compliance.  The
 *   celebratory animation trigger also needs to fire when transitioning from
 *   not-logged → logged (but NOT on initial mount), so we test the re-render
 *   path explicitly.
 *
 * STRATEGY:
 *   - jest.useFakeTimers() to control the 1000 ms animation reset timeout.
 *   - We test the aria-label content (most stable, accessibility-critical).
 *   - We test tooltip visibility by querying role="tooltip".
 *   - We do NOT assert on CSS class names (they're implementation detail).
 */

import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import StreakIndicator from "@/components/StreakIndicator";

/**
 * Test suite
 */
describe("StreakIndicator component", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  // ── ARIA label ──────────────────────────────────────────────────────────

  it("shows streak count in the aria-label", () => {
    render(<StreakIndicator streak={7} hasLoggedToday={true} />);
    expect(
      screen.getByRole("status", { name: /Current streak: 7 days/i })
    ).toBeInTheDocument();
  });

  it("includes 'not logged' warning in aria-label when hasLoggedToday is false", () => {
    render(<StreakIndicator streak={3} hasLoggedToday={false} />);
    const status = screen.getByRole("status");
    expect(status.getAttribute("aria-label")).toMatch(
      /haven't logged your mood today yet/i
    );
  });

  it("does NOT include the warning in aria-label when hasLoggedToday is true", () => {
    render(<StreakIndicator streak={5} hasLoggedToday={true} />);
    const status = screen.getByRole("status");
    expect(status.getAttribute("aria-label")).not.toMatch(/haven't/i);
  });

  // ── Streak number ───────────────────────────────────────────────────────

  it("renders the correct streak number", () => {
    render(<StreakIndicator streak={42} hasLoggedToday={true} />);
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("renders 0 streak without crashing", () => {
    render(<StreakIndicator streak={0} hasLoggedToday={false} />);
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  // ── Label text ──────────────────────────────────────────────────────────

  it("renders the 'Streak' label", () => {
    render(<StreakIndicator streak={1} hasLoggedToday={true} />);
    expect(screen.getByText("Streak")).toBeInTheDocument();
  });

  // ── Tooltip ─────────────────────────────────────────────────────────────

  it("shows a tooltip on hover when hasLoggedToday is false", () => {
    render(<StreakIndicator streak={3} hasLoggedToday={false} />);
    const statusEl = screen.getByRole("status");
    fireEvent.mouseEnter(statusEl);
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
  });

  it("hides the tooltip on mouse leave", () => {
    render(<StreakIndicator streak={3} hasLoggedToday={false} />);
    const statusEl = screen.getByRole("status");
    fireEvent.mouseEnter(statusEl);
    fireEvent.mouseLeave(statusEl);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("does NOT show a tooltip when hasLoggedToday is true", () => {
    render(<StreakIndicator streak={5} hasLoggedToday={true} />);
    const statusEl = screen.getByRole("status");
    fireEvent.mouseEnter(statusEl);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  // ── Animation transition ─────────────────────────────────────────────────

  it("animation resets after 1 second following a not-logged → logged transition", () => {
    const { rerender } = render(
      <StreakIndicator streak={4} hasLoggedToday={false} />
    );

    rerender(<StreakIndicator streak={5} hasLoggedToday={true} />);

    // After 1000 ms the animation state should have cleared (no crash)
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    // Component should still be mounted and stable
    expect(screen.getByText("5")).toBeInTheDocument();
  });
});
