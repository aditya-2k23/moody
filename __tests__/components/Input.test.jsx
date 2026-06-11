/**
 * __tests__/components/Input.test.jsx
 *
 * Tests for the Input component in components/Input.js.
 *
 * WHY THIS TEST EXISTS:
 *   Input is used in the Login/Signup form.  Email + password inputs must
 *   render the correct input type (so browsers show the right keyboard / apply
 *   password masking), display placeholder text, reflect controlled value, and
 *   fire onChange so the parent state updates.  A silent regression in any of
 *   these would break authentication.
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import Input from "@/components/Input";

/**
 * Test suite
 */
describe("Input component", () => {
  it("renders an <input> element", () => {
    render(<Input />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("applies the provided inputType (e.g. email)", () => {
    render(<Input inputType="email" />);
    expect(screen.getByRole("textbox")).toHaveAttribute("type", "email");
  });

  it("defaults to empty string for inputType", () => {
    render(<Input />);
    // type="" renders as type="text" in browsers / jsdom
    const input = document.querySelector("input");
    expect(input).toHaveAttribute("type", "");
  });

  it("shows the placeholder text", () => {
    render(<Input placeholderText="Enter your email" />);
    expect(screen.getByPlaceholderText("Enter your email")).toBeInTheDocument();
  });

  it("reflects the controlled value", () => {
    render(<Input value="test@example.com" onChange={() => {}} />);
    expect(screen.getByRole("textbox")).toHaveValue("test@example.com");
  });

  it("calls onChange with the event when the user types", () => {
    const handleChange = jest.fn();
    render(<Input value="" onChange={handleChange} />);
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "moody@test.com" },
    });
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it("renders as a password input and is not queryable by textbox role", () => {
    const { container } = render(<Input inputType="password" value="" onChange={() => {}} />);
    // password inputs are not exposed as "textbox" role
    expect(container.querySelector("input[type='password']")).toBeInTheDocument();
  });
});
