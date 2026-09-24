import type { Request, Response } from "express";

import {
  searchListing,
  searchListingSuggestion,
  ListingSearchServiceError,
} from "../services/listing-search.service";

import {
  listingSearchQuerySchema,
  listingSearchSuggestQuerySchema,
} from "../validators/listing-search.validator";

function sanitizeListing(listing: {
  id: string;
  seller_id: string | null;
  category_id: string;
  make: string;
  model: string;
  year: number;
  mileage: number;
  price: string;
  condition: string;
  transmission: string;
  fuel_type: string;
  color: string;
  location: string;
  description: string | null;
  status: string;
  created_at: Date;
  updated_at: Date;
}) {
  return {
    id: listing.id,
    seller_id: listing.seller_id,
    category_id: listing.category_id,
    make: listing.make,
    model: listing.model,
    year: listing.year,
    mileage: listing.mileage,
    price: listing.price,
    condition: listing.condition,
    transmission: listing.transmission,
    fuel_type: listing.fuel_type,
    color: listing.color,
    location: listing.location,
    description: listing.description,
    status: listing.status,
    created_at: listing.created_at,
    updated_at: listing.updated_at,
  };
}

export async function searchListings(
  req: Request,
  res: Response,
): Promise<void> {
  const parsed = listingSearchQuerySchema.safeParse(req.query);

  if (!parsed.success) {
    res.status(422).json({
      status: false,
      message: "Validation failed",
      data: parsed.error.flatten(),
    });

    return;
  }

  try {
    const result = await searchListing(parsed.data);

    res.status(200).json({
      status: true,
      message: "Listings search completed successfully",
      data: {
        items: result.listings.map(sanitizeListing),
        pagination: {
          limit: parsed.data.limit,
          next_cursor: result.nextCursor,
        },
      },
    });
  } catch (error) {
    if (error instanceof ListingSearchServiceError) {
      res.status(error.statusCode).json({
        status: false,
        message: error.message,
        data: null,
      });

      return;
    }

    throw error;
  }
}

export async function searchListingSuggestions(
  req: Request,
  res: Response,
): Promise<void> {
  const parsed = listingSearchSuggestQuerySchema.safeParse(
    req.query,
  );

  if (!parsed.success) {
    res.status(422).json({
      status: false,
      message: "Validation failed",
      data: parsed.error.flatten(),
    });

    return;
  }

  try {
    const result = await searchListingSuggestion(parsed.data.q);

    res.status(200).json({
      status: true,
      message: "Suggestions retrieved successfully",
      data: result,
    });
  } catch (error) {
    if (error instanceof ListingSearchServiceError) {
      res.status(error.statusCode).json({
        status: false,
        message: error.message,
        data: null,
      });

      return;
    }

    throw error;
  }
}