"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const duration_1 = require("@utils/duration");
(0, vitest_1.describe)("durationToSeconds", () => {
    (0, vitest_1.it)("parses minute strings", () => {
        (0, vitest_1.expect)((0, duration_1.durationToSeconds)("15m")).toBe(900);
    });
    (0, vitest_1.it)("parses hour strings", () => {
        (0, vitest_1.expect)((0, duration_1.durationToSeconds)("2h")).toBe(7200);
    });
    (0, vitest_1.it)("falls back for invalid input", () => {
        (0, vitest_1.expect)((0, duration_1.durationToSeconds)("invalid")).toBe(900);
    });
});
//# sourceMappingURL=duration.test.js.map