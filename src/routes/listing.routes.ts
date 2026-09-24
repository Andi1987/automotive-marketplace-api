import { Router } from "express";

import {
  createListing,
  deleteListing,
  getListing,
  getListings,
  updateListing,
} from "../controllers/listing.controller";

import { searchListings } from "../controllers/listing-search.controller";

const router = Router();

router.post("/", createListing);
router.get("/", getListings);

/*
 * Static route MUST be registered before /:id.
 * Otherwise "search" will be interpreted as a listing UUID.
 */
router.get("/search", searchListings);

router.get("/:id", getListing);
router.patch("/:id", updateListing);
router.delete("/:id", deleteListing);

export default router;