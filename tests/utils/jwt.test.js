"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const jwt_1 = require("@utils/jwt");
(0, vitest_1.describe)("jwt utilities", () => {
    (0, vitest_1.it)("signs and verifies access tokens", () => {
        const token = (0, jwt_1.signAccessToken)({
            sub: "user-1",
            email: "user@example.com",
            role: "USER"
        });
        const payload = (0, jwt_1.verifyAccessToken)(token);
        (0, vitest_1.expect)(payload.sub).toBe("user-1");
        (0, vitest_1.expect)(payload.type).toBe("access");
    });
    (0, vitest_1.it)("signs and verifies refresh tokens", () => {
        const token = (0, jwt_1.signRefreshToken)({
            sub: "user-2",
            email: "user2@example.com",
            role: "ADMIN"
        });
        const payload = (0, jwt_1.verifyRefreshToken)(token);
        (0, vitest_1.expect)(payload.sub).toBe("user-2");
        (0, vitest_1.expect)(payload.type).toBe("refresh");
    });
    (0, vitest_1.it)("throws on invalid access token", () => {
        (0, vitest_1.expect)(() => (0, jwt_1.verifyAccessToken)("invalid.token")).toThrow();
    });
});
//# sourceMappingURL=jwt.test.js.map