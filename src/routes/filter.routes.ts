import { Router } from "express";

import {
  getFilters,
  getFiltersByCategory,
} from "../controllers/filter.controller";

const router = Router();

router.get("/", getFilters);
router.get("/:categoryId", getFiltersByCategory);

export default router;