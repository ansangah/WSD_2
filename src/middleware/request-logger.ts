import pinoHttp from "pino-http";
import { logger } from "@core/logger";

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
      responseTime: res.responseTime
    })
  },
  customSuccessMessage: function (req, res) {
    return `HTTP ${req.method} ${req.url} ${res.statusCode} ${res.responseTime}ms`;
  },
  customErrorMessage: function (req, res) {
    return `HTTP ${req.method} ${req.url} ${res.statusCode} ${res.responseTime}ms`;
  }
});
