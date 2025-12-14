import pinoHttp from "pino-http";
import { logger } from "@core/logger";

const getResponseTimeMs = (res: unknown): number | undefined =>
  typeof (res as { responseTime?: unknown })?.responseTime === "number"
    ? ((res as { responseTime: number }).responseTime as number)
    : undefined;

export const requestLogger = pinoHttp({
  logger,
  customAttributeKeys: {
    req: "request",
    res: "response",
    err: "error"
  },
  serializers: {
    request: (req) => ({
      method: req.method,
      path: req.url
    }),
    response: (res) => ({
      statusCode: res.statusCode,
      responseTime: getResponseTimeMs(res)
    })
  },
  customSuccessMessage: function (req, res) {
    const responseTime = getResponseTimeMs(res);
    return `HTTP ${req.method} ${req.url} ${res.statusCode}${
      responseTime == null ? "" : ` ${responseTime}ms`
    }`;
  },
  customErrorMessage: function (req, res) {
    const responseTime = getResponseTimeMs(res);
    return `HTTP ${req.method} ${req.url} ${res.statusCode}${
      responseTime == null ? "" : ` ${responseTime}ms`
    }`;
  }
});
