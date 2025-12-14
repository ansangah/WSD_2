import { describe, it, expect } from "vitest";
import {
  getPaginationParams,
  buildPaginationResponse
} from "@utils/pagination";

describe("pagination utilities", () => {
  it("computes skip/take defaults", () => {
    const params = getPaginationParams({});
    expect(params.page).toBe(1);
    expect(params.size).toBe(20);
    expect(params.skip).toBe(0);
    expect(params.take).toBe(20);
  });

  it("builds response metadata", () => {
    const response = buildPaginationResponse([1, 2, 3], 50, 2, 3, "id,asc");
    expect(response.totalPages).toBe(Math.ceil(50 / 3));
    expect(response.page).toBe(2);
    expect(response.content).toHaveLength(3);
    expect(response.sort).toBe("id,asc");
  });
});
