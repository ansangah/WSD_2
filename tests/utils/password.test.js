"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const password_1 = require("@utils/password");
(0, vitest_1.describe)("password utilities", () => {
    (0, vitest_1.it)("hashes password securely", async () => {
        const hash = await (0, password_1.hashPassword)("Hello123!");
        (0, vitest_1.expect)(hash).not.toEqual("Hello123!");
        (0, vitest_1.expect)(hash).toMatch(/^\$2[aby]\$/);
    });
    (0, vitest_1.it)("compares passwords correctly", async () => {
        const hash = await (0, password_1.hashPassword)("Secret#123");
        (0, vitest_1.expect)(await (0, password_1.comparePassword)("Secret#123", hash)).toBe(true);
        (0, vitest_1.expect)(await (0, password_1.comparePassword)("Wrong", hash)).toBe(false);
    });
});
//# sourceMappingURL=password.test.js.map