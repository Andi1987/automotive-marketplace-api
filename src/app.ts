import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";

import { checkDatabaseConnection } from "./config/database";
import { swaggerDocument } from "./config/swagger";

import userRoutes from "./routes/user.routes";
import categoryRoutes from "./routes/category.routes";
import filterRoutes from "./routes/filter.routes";
import listingSearchRoutes from "./routes/listing-search.routes";
import listingRoutes from "./routes/listing.routes";

const app = express();

app.set("query parser", "extended");

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: true,
    message: "Automotive Marketplace API is running",
    data: {
      service: "automotive-marketplace-api",
      version: "1.0.0",
    },
  });
});

app.get("/health/db", async (_req, res) => {
  try {
    await checkDatabaseConnection();

    res.status(200).json({
      status: true,
      message: "Database connection is healthy",
      data: {
        database: "postgresql",
      },
    });
  } catch (error) {
    console.error("Database health check failed:", error);

    res.status(503).json({
      status: false,
      message: "Database connection is unavailable",
      data: null,
    });
  }
});

/*
 * Swagger UI
 *
 * Open:
 * http://localhost:3000/api/docs
 */
app.use(
  "/api/docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument, {
    explorer: true,
    customSiteTitle: "Automotive Marketplace API Documentation",
  }),
);

app.use("/api/v1/categories", categoryRoutes);
app.use("/api/v1/filters", filterRoutes);
app.use("/api/v1/listings/search", listingSearchRoutes);
app.use("/api/v1/listings", listingRoutes);
app.use("/api/v1/users", userRoutes);

export default app;