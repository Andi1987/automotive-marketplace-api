import app from "./app";
import { checkDatabaseConnection } from "./config/database";
import { env } from "./config/env";

async function startServer(): Promise<void> {
  try {
    await checkDatabaseConnection();

    app.listen(env.port, "0.0.0.0", () => {
      console.log(
        `Automotive Marketplace API running on port ${env.port}`,
      );
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

void startServer();