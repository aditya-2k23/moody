/**
 * __tests__/components/NewFeatureDot.test.jsx
 *
 * Tests for the NewFeatureDot indicator component.
 *
 * WHY THIS TEST EXISTS:
 *   NewFeatureDot is a simple indicator used across multiple navbar items to
 *   announce new features.  While simple, it has an aria-label that assistive
 *   technologies read aloud ("New feature").  A regression that removes the
 *   aria-label would silently make feature announcements inaccessible.
 *   Additionally, the className prop is used for positioning — verifying it
 *   is applied ensures the dot appears in the right place relative to its
 *   parent element.
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import NewFeatureDot from "@/components/NewFeatureDot";

describe("NewFeatureDot component", () => {
  it("renders a span element", () => {
    const { container } = render(<NewFeatureDot />);
    expect(container.querySelector("span")).toBeInTheDocument();
  });

  it("has aria-label='New feature' for accessibility", () => {
    render(<NewFeatureDot />);
    expect(screen.getByLabelText("New feature")).toBeInTheDocument();
  });

  it("applies a custom className for positioning", () => {
    const { container } = render(<NewFeatureDot className="top-0 right-0" />);
    const span = container.querySelector("span");
    expect(span.className).toContain("top-0");
    expect(span.className).toContain("right-0");
  });

  it("uses an empty string as the default className", () => {
    const { container } = render(<NewFeatureDot />);
    // Default className="" so the base classes should still be present
    const span = container.querySelector("span");
    expect(span.className).toContain("bg-red-500");
  });
});
