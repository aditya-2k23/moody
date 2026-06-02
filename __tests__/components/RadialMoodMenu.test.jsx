/**
 * __tests__/components/RadialMoodMenu.test.jsx
 *
 * Tests for the RadialMoodMenu (GTA-style mood wheel) component.
 *
 * WHY THIS TEST EXISTS:
 *   RadialMoodMenu is the primary mood-selection interface.  Any regression in
 *   the open/close logic, mood selection callback, or keyboard accessibility
 *   would directly prevent users from logging their mood — the app's core
 *   feature.  We also verify the disabled prop prevents any interaction,
 *   important for read-only views of past entries.
 *
 * STRATEGY:
 *   - Render with a realistic `moods` array that mirrors the actual data.
 *   - Use jest.useFakeTimers() to fast-forward the 300 ms hover delay.
 *   - Mock `onMoodChange` to verify call arguments (mood object + index).
 *   - Test keyboard (Escape) close without exercising CSS animations.
 *
 * MOCK:
 *   RadialMoodMenu imports ../styles/RadialMoodMenu.css which is handled by
 *   the styleMock in __mocks__/styleMock.js (via moduleNameMapper in jest.config.js).
 *
 * NOTE ON ROLES:
 *   Mood items render with role="menuitemradio" (correct ARIA pattern for a
 *   single-select menu).  Queries use that role rather than "button".
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import RadialMoodMenu from "@/components/RadialMoodMenu";

const sampleMoods = [
  { emoji: "😭", label: "Awful" },
  { emoji: "🥺", label: "Sad" },
  { emoji: "😐", label: "Existing" },
  { emoji: "😊", label: "Good" },
  { emoji: "😃", label: "Elated" },
];

describe("RadialMoodMenu component", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  // ── Rendering ────────────────────────────────────────────────────────────

  it("renders the trigger button", () => {
    render(
      <RadialMoodMenu
        moods={sampleMoods}
        currentMoodEmoji={null}
        currentMoodLabel={null}
        onMoodChange={() => {}}
      />
    );
    // Center trigger: "+" when no mood set
    expect(screen.getByText("+")).toBeInTheDocument();
  });

  it("renders the current mood emoji in the trigger when a mood is set", () => {
    render(
      <RadialMoodMenu
        moods={sampleMoods}
        currentMoodEmoji="😊"
        currentMoodLabel="Good"
        onMoodChange={() => {}}
      />
    );
    // Use aria-label query rather than getByText: the emoji appears in both
    // the trigger span and the hidden menu item (role=menuitemradio), which
    // causes getByText to find multiple elements.
    expect(
      screen.getByRole("button", { name: /Current mood: Good/i })
    ).toBeInTheDocument();
  });

  it("returns null when no moods are provided", () => {
    const { container } = render(
      <RadialMoodMenu
        moods={[]}
        currentMoodEmoji={null}
        currentMoodLabel={null}
        onMoodChange={() => {}}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  // ── Trigger button accessibility ─────────────────────────────────────────

  it("shows 'No mood set' aria-label when no mood selected", () => {
    render(
      <RadialMoodMenu
        moods={sampleMoods}
        currentMoodEmoji={null}
        currentMoodLabel={null}
        onMoodChange={() => {}}
      />
    );
    const trigger = screen.getByRole("button", { name: /no mood set/i });
    expect(trigger).toBeInTheDocument();
  });

  it("shows current mood in aria-label when mood is set", () => {
    render(
      <RadialMoodMenu
        moods={sampleMoods}
        currentMoodEmoji="😃"
        currentMoodLabel="Elated"
        onMoodChange={() => {}}
      />
    );
    expect(
      screen.getByRole("button", { name: /Current mood: Elated/i })
    ).toBeInTheDocument();
  });

  // ── Open / close ─────────────────────────────────────────────────────────

  it("opens the mood menu when the trigger is clicked", () => {
    render(
      <RadialMoodMenu
        moods={sampleMoods}
        currentMoodEmoji={null}
        currentMoodLabel={null}
        onMoodChange={() => {}}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /no mood set/i }));
    // Mood items render as role="menuitemradio" (correct ARIA for single-select menus)
    expect(
      screen.getByRole("menuitemradio", { name: "Select mood: Awful" })
    ).toBeInTheDocument();
  });

  it("closes the menu when Escape is pressed (items become tabindex=-1)", () => {
    render(
      <RadialMoodMenu
        moods={sampleMoods}
        currentMoodEmoji={null}
        currentMoodLabel={null}
        onMoodChange={() => {}}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /no mood set/i }));
    // Confirm menu is open
    expect(
      screen.getByRole("menuitemradio", { name: "Select mood: Awful" })
    ).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });

    // After Escape, items get tabIndex=-1 (closed state in the component)
    const awfulBtn = screen.getByRole("menuitemradio", { name: "Select mood: Awful" });
    expect(awfulBtn).toHaveAttribute("tabindex", "-1");
  });

  // ── Mood selection ───────────────────────────────────────────────────────

  it("calls onMoodChange with the correct mood object and index", () => {
    const handler = jest.fn();
    render(
      <RadialMoodMenu
        moods={sampleMoods}
        currentMoodEmoji={null}
        currentMoodLabel={null}
        onMoodChange={handler}
      />
    );
    // Open menu
    fireEvent.click(screen.getByRole("button", { name: /no mood set/i }));
    // Select "Good" (index 3) — queried by menuitemradio role
    fireEvent.click(
      screen.getByRole("menuitemradio", { name: "Select mood: Good" })
    );
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith({ emoji: "😊", label: "Good" }, 3);
  });

  it("marks the currently selected mood as aria-checked=true", () => {
    render(
      <RadialMoodMenu
        moods={sampleMoods}
        currentMoodEmoji="😊"
        currentMoodLabel="Good"
        onMoodChange={() => {}}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /Current mood: Good/i }));
    const goodItem = screen.getByRole("menuitemradio", { name: "Select mood: Good" });
    expect(goodItem).toHaveAttribute("aria-checked", "true");
  });

  // ── Disabled state ───────────────────────────────────────────────────────

  it("does not open when disabled (items stay tabindex=-1)", () => {
    render(
      <RadialMoodMenu
        moods={sampleMoods}
        currentMoodEmoji={null}
        currentMoodLabel={null}
        onMoodChange={() => {}}
        disabled
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /no mood set/i }));
    // Menu items should still be tabindex=-1 (closed/disabled state)
    const awfulBtn = screen.getByRole("menuitemradio", { name: "Select mood: Awful" });
    expect(awfulBtn).toHaveAttribute("tabindex", "-1");
  });
});
