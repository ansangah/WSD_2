import "dotenv/config";
import "express-async-errors";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { env } from "@config/env";
import { apiRateLimiter } from "@middleware/rate-limit";
import { requestLogger } from "@middleware/request-logger";
import { notFoundHandler } from "@middleware/not-found";
import { errorHandler } from "@middleware/error-handler";
import { registerRoutes } from "@routes/index";
import { getOpenApiDocument } from "@config/swagger";

const app = express();

app.set("trust proxy", 1);
app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN === "*" ? undefined : env.CORS_ORIGIN.split(","),
    credentials: true
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(apiRateLimiter);
app.use(requestLogger);

registerRoutes(app);

if (env.SWAGGER_ENABLED) {
  const document = getOpenApiDocument();
  // Swagger UI uses inline scripts/styles; remove CSP headers for this route only.
  app.use(
    "/docs",
    (_req, res, next) => {
      res.removeHeader("Content-Security-Policy");
      res.removeHeader("Content-Security-Policy-Report-Only");
      next();
    },
    swaggerUi.serve,
    swaggerUi.setup(document)
  );
}

app.use(notFoundHandler);
app.use(errorHandler);

export { app };
