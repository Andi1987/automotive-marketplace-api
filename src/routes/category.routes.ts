import { Router } from "express";

import {
  createCategory,
  getCategories,
  getCategory,
  getCategoryListings,
  updateCategory,
} from "../controllers/category.controller";

const router = Router();

router.get(
  "/",
  getCategories,
);

router.get(
  "/:id/listings",
  getCategoryListings,
);

router.get(
  "/:id",
  getCategory,
);

router.post(
  "/",
  createCategory,
);

router.patch(
  "/:id",
  updateCategory,
);

export default router;