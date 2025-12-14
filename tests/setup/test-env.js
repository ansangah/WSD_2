"use strict";
process.env.DATABASE_URL =
    process.env.DATABASE_URL ??
        "postgresql://postgres:password@localhost:15432/test_db?schema=public";
process.env.JWT_ACCESS_SECRET =
    process.env.JWT_ACCESS_SECRET ?? "test-access-secret-1234567890123456";
process.env.JWT_REFRESH_SECRET =
    process.env.JWT_REFRESH_SECRET ?? "test-refresh-secret-1234567890123456";
process.env.ACCESS_TOKEN_TTL = process.env.ACCESS_TOKEN_TTL ?? "15m";
process.env.REFRESH_TOKEN_TTL = process.env.REFRESH_TOKEN_TTL ?? "7d";
process.env.CORS_ORIGIN = process.env.CORS_ORIGIN ?? "*";
process.env.PORT = process.env.PORT ?? "8080";
//# sourceMappingURL=test-env.js.map
