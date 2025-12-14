"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const pagination_1 = require("@utils/pagination");
(0, vitest_1.describe)("pagination utilities", () => {
    (0, vitest_1.it)("computes skip/take defaults", () => {
        const params = (0, pagination_1.getPaginationParams)({});
        (0, vitest_1.expect)(params.page).toBe(1);
        (0, vitest_1.expect)(params.size).toBe(20);
        (0, vitest_1.expect)(params.skip).toBe(0);
        (0, vitest_1.expect)(params.take).toBe(20);
    });
    (0, vitest_1.it)("builds response metadata", () => {
        const response = (0, pagination_1.buildPaginationResponse)([1, 2, 3], 50, 2, 3, "id,asc");
        (0, vitest_1.expect)(response.totalPages).toBe(Math.ceil(50 / 3));
        (0, vitest_1.expect)(response.page).toBe(2);
        (0, vitest_1.expect)(response.content).toHaveLength(3);
        (0, vitest_1.expect)(response.sort).toBe("id,asc");
    });
});
//# sourceMappingURL=pagination.test.js.map