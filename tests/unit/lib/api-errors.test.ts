import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { sanitizeDbError } from "@/lib/api-errors";

describe("sanitizeDbError", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("returns generic error message", () => {
    const result = sanitizeDbError(new Error("Sensitive database error"));
    expect(result).toBe("An error occurred while processing your request");
  });

  it("logs the original error to console", () => {
    const error = new Error("Database connection failed");
    sanitizeDbError(error);

    expect(consoleErrorSpy).toHaveBeenCalledWith("Database error:", error);
  });

  it("logs with context when provided", () => {
    const error = new Error("Constraint violation");
    sanitizeDbError(error, "POST /api/users");

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Database error in POST /api/users:",
      error
    );
  });

  it("handles non-Error objects", () => {
    const result = sanitizeDbError({ code: "23505", message: "unique violation" });
    expect(result).toBe("An error occurred while processing your request");
  });

  it("handles string errors", () => {
    const result = sanitizeDbError("Something went wrong");
    expect(result).toBe("An error occurred while processing your request");
  });

  it("handles null/undefined errors", () => {
    const result1 = sanitizeDbError(null);
    const result2 = sanitizeDbError(undefined);

    expect(result1).toBe("An error occurred while processing your request");
    expect(result2).toBe("An error occurred while processing your request");
  });
});
