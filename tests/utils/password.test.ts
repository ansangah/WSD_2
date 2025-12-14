import { describe, it, expect } from "vitest";
import { hashPassword, comparePassword } from "@utils/password";

describe("password utilities", () => {
  it("hashes password securely", async () => {
    const hash = await hashPassword("Hello123!");
    expect(hash).not.toEqual("Hello123!");
    expect(hash).toMatch(/^\$2[aby]\$/);
  });

  it("compares passwords correctly", async () => {
    const hash = await hashPassword("Secret#123");
    expect(await comparePassword("Secret#123", hash)).toBe(true);
    expect(await comparePassword("Wrong", hash)).toBe(false);
  });
});
