import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  DynamicIcon,
  IconBadge,
  ColorPicker,
} from "@/components/ui/icon-picker";

describe("DynamicIcon", () => {
  it("should render an icon by name", () => {
    const { container } = render(<DynamicIcon name="wallet" />);
    // Icon renders as an SVG
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });

  it("should apply custom className", () => {
    const { container } = render(
      <DynamicIcon name="wallet" className="h-8 w-8" />,
    );
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveClass("h-8", "w-8");
  });

  it("should show placeholder for unknown icon names", () => {
    const { container } = render(<DynamicIcon name="nonexistent-icon-xyz" />);
    // Should render a "?" span for unknown icons
    const span = container.querySelector("span");
    expect(span).toBeInTheDocument();
    expect(span?.textContent).toBe("?");
  });

  it("should convert kebab-case to PascalCase correctly", () => {
    const { container } = render(<DynamicIcon name="arrow-right" />);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });
});

describe("IconBadge", () => {
  it("should render icon in a colored circle", () => {
    const { container } = render(<IconBadge icon="wallet" color="#6366f1" />);
    const badge = container.querySelector("span");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveStyle({ backgroundColor: "rgb(99, 102, 241)" });
  });

  it("should apply correct size classes for xs", () => {
    const { container } = render(
      <IconBadge icon="wallet" color="#6366f1" size="xs" />,
    );
    const badge = container.querySelector("span");
    expect(badge).toHaveClass("h-4", "w-4");
  });

  it("should apply correct size classes for sm", () => {
    const { container } = render(
      <IconBadge icon="wallet" color="#6366f1" size="sm" />,
    );
    const badge = container.querySelector("span");
    expect(badge).toHaveClass("h-5", "w-5");
  });

  it("should apply correct size classes for lg", () => {
    const { container } = render(
      <IconBadge icon="wallet" color="#6366f1" size="lg" />,
    );
    const badge = container.querySelector("span");
    expect(badge).toHaveClass("h-8", "w-8");
  });

  it("should use md size by default", () => {
    const { container } = render(<IconBadge icon="wallet" color="#6366f1" />);
    const badge = container.querySelector("span");
    // md size is "h-7 w-7 sm:h-8 sm:w-8"
    expect(badge).toHaveClass("h-7", "w-7");
  });

  it("should have white text color", () => {
    const { container } = render(<IconBadge icon="wallet" color="#6366f1" />);
    const badge = container.querySelector("span");
    expect(badge).toHaveClass("text-white");
  });

  it("should apply additional className", () => {
    const { container } = render(
      <IconBadge icon="wallet" color="#6366f1" className="custom-class" />,
    );
    const badge = container.querySelector("span");
    expect(badge).toHaveClass("custom-class");
  });

  it("should have rounded-full class", () => {
    const { container } = render(<IconBadge icon="wallet" color="#6366f1" />);
    const badge = container.querySelector("span");
    expect(badge).toHaveClass("rounded-full");
  });

  it("should contain an icon SVG", () => {
    const { container } = render(<IconBadge icon="wallet" color="#6366f1" />);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });
});

describe("ColorPicker", () => {
  const mockColors = ["#ef4444", "#22c55e", "#3b82f6", "#6366f1"];
  const mockOnChange = vi.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it("should render all color options", () => {
    render(
      <ColorPicker
        value="#ef4444"
        onChange={mockOnChange}
        colors={mockColors}
      />,
    );

    // Each color should be rendered as a button
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThanOrEqual(4);
  });

  it("should call onChange when a color is selected", async () => {
    const user = userEvent.setup();
    render(
      <ColorPicker
        value="#ef4444"
        onChange={mockOnChange}
        colors={mockColors}
      />,
    );

    // Click the second color (green)
    const buttons = screen.getAllByRole("button");
    await user.click(buttons[1]);

    expect(mockOnChange).toHaveBeenCalledWith("#22c55e");
  });

  it("should render icon preview when icon prop is provided", () => {
    const { container } = render(
      <ColorPicker
        value="#ef4444"
        onChange={mockOnChange}
        colors={mockColors}
        icon="shopping-cart"
      />,
    );

    // Each color button should contain an icon (SVG)
    const svgs = container.querySelectorAll("svg");
    expect(svgs.length).toBeGreaterThan(0);
  });

  it("should have custom color input field", () => {
    render(
      <ColorPicker
        value="#ef4444"
        onChange={mockOnChange}
        colors={mockColors}
      />,
    );

    const hexInput = screen.getByPlaceholderText("#HEX");
    expect(hexInput).toBeInTheDocument();
  });

  it("should show custom color value in input when value is not in colors array", () => {
    render(
      <ColorPicker
        value="#ff00ff"
        onChange={mockOnChange}
        colors={mockColors}
      />,
    );

    // When value is a custom color (not in preset colors), the input shows it
    const hexInput = screen.getByPlaceholderText("#HEX") as HTMLInputElement;
    expect(hexInput.value).toBe("#ff00ff");
  });

  it("should respect columns prop for grid layout", () => {
    const { container } = render(
      <ColorPicker
        value="#ef4444"
        onChange={mockOnChange}
        colors={mockColors}
        columns={4}
      />,
    );

    const grid = container.querySelector(".grid");
    // Columns are set via inline style, not class
    expect(grid).toHaveStyle({
      gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    });
  });

  it("should call onChange when typing a valid hex color", async () => {
    const user = userEvent.setup();
    render(
      <ColorPicker
        value="#ef4444"
        onChange={mockOnChange}
        colors={mockColors}
      />,
    );

    const hexInput = screen.getByPlaceholderText("#HEX");
    await user.clear(hexInput);
    await user.type(hexInput, "#ff00ff");

    expect(mockOnChange).toHaveBeenCalledWith("#ff00ff");
  });
});
