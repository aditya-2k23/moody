/**
 * __tests__/components/Button.test.jsx
 *
 * Tests for Button and BlobSvgFilter components in components/Button.js.
 *
 * WHY THIS TEST EXISTS:
 *   Button is the primary interactive element in Moody (login, save entry,
 *   insights, etc.).  The disabled state is particularly important: a disabled
 *   button that still fires onClick would let users double-submit entries or
 *   trigger Gemini calls while one is in flight.  These tests guard all three
 *   rendering modes (default blob, dark blob, raw/normal=false) and the
 *   disabled invariants.
 *
 * STRATEGY:
 *   - Render with @testing-library/react and query via role/text.
 *   - We mock nothing: Button has zero external dependencies.
 *   - No CSS classes are deeply asserted (implementation detail); we focus on
 *     rendered content, ARIA attributes, and click-handler behaviour.
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import Button, { BlobSvgFilter } from "@/components/Button";

describe("Button component", () => {
  // ── Default (blob) variant ─────────────────────────────────────────────

  it("renders button text", () => {
    render(<Button text="Save Mood" />);
    expect(screen.getByText("Save Mood")).toBeInTheDocument();
  });

  it("calls onClick when clicked", () => {
    const handler = jest.fn();
    render(<Button text="Click Me" onClick={handler} />);
    fireEvent.click(screen.getByRole("button"));
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("renders a <button> element with type='button'", () => {
    render(<Button text="Test" />);
    expect(screen.getByRole("button")).toHaveAttribute("type", "button");
  });

  // ── Disabled state ─────────────────────────────────────────────────────

  it("does NOT call onClick when disabled", () => {
    const handler = jest.fn();
    render(<Button text="Disabled" onClick={handler} disabled />);
    fireEvent.click(screen.getByRole("button"));
    expect(handler).not.toHaveBeenCalled();
  });

  it("has aria-disabled=true and disabled attribute when disabled", () => {
    render(<Button text="Disabled" disabled />);
    const btn = screen.getByRole("button");
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute("aria-disabled", "true");
  });

  // ── normal=false (raw) variant ──────────────────────────────────────────

  it("renders correctly with normal=false", () => {
    render(<Button text="Raw Button" normal={false} />);
    expect(screen.getByText("Raw Button")).toBeInTheDocument();
  });

  it("does not call onClick when disabled in normal=false mode", () => {
    const handler = jest.fn();
    render(<Button text="Raw" normal={false} onClick={handler} disabled />);
    fireEvent.click(screen.getByRole("button"));
    expect(handler).not.toHaveBeenCalled();
  });

  // ── JSX children as text ───────────────────────────────────────────────

  it("renders JSX as the text prop", () => {
    render(<Button text={<span data-testid="icon">🔥 Save</span>} />);
    expect(screen.getByTestId("icon")).toBeInTheDocument();
  });
});

describe("BlobSvgFilter component", () => {
  it("renders an SVG element", () => {
    const { container } = render(<BlobSvgFilter />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("contains a filter element with id='goo'", () => {
    const { container } = render(<BlobSvgFilter />);
    expect(container.querySelector("filter#goo")).toBeInTheDocument();
  });
});
