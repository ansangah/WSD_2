import "dotenv/config";
import { env } from "@config/env";
import { logger } from "@core/logger";
import { app } from "./app";

const port = env.PORT;

app.listen(port, () => {
  logger.info(`Server running on port ${port}`);
});
