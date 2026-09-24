import { Router } from "express";

import {
  searchListings,
  searchListingSuggestions,
} from "../controllers/listing-search.controller";

const router = Router();

router.get("/suggest", searchListingSuggestions);

router.get("/", searchListings);

export default router;