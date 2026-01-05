import { describe, expect, it } from "vitest";
import { cn } from "@/lib/utils";

describe("cn utility", () => {
  it("should merge class names", () => {
    const result = cn("px-4", "py-2");
    expect(result).toBe("px-4 py-2");
  });

  it("should handle conditional classes", () => {
    const isActive = true;
    const result = cn("base-class", isActive && "active");
    expect(result).toBe("base-class active");
  });

  it("should handle falsy values", () => {
    const result = cn("base", false, null, undefined, "end");
    expect(result).toBe("base end");
  });

  it("should resolve Tailwind conflicts", () => {
    const result = cn("px-4", "px-8");
    expect(result).toBe("px-8");
  });
});
