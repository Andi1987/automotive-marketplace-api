import type { Request, Response } from "express";

import {
  createNewListing,
  getListingById,
  listListings,
  ListingServiceError,
  removeListing,
  updateExistingListing,
} from "../services/listing.service";

import {
  createListingSchema,
  listingQuerySchema,
  updateListingSchema,
} from "../validators/listing.validator";

function getListingId(req: Request): string | null {
  const { id } = req.params;

  if (typeof id !== "string") {
    return null;
  }

  return id;
}

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

function sanitizeImages(
  images: {
    id: string;
    listing_id: string;
    image_url: string;
    sort_order: number;
    created_at: Date;
  }[],
) {
  return images.map((image) => ({
    id: image.id,
    image_url: image.image_url,
    sort_order: image.sort_order,
  }));
}

function sanitizeAttributes(
  attributes: {
    id: string;
    listing_id: string;
    attribute_id: string;
    option_id: string | null;
    value_text: string | null;
    value_number: string | null;
    value_boolean: boolean | null;
    created_at: Date;
  }[],
) {
  return attributes.map((attribute) => ({
    id: attribute.id,
    attribute_id: attribute.attribute_id,
    option_id: attribute.option_id,
    value_text: attribute.value_text,
    value_number: attribute.value_number,
    value_boolean: attribute.value_boolean,
  }));
}

function sendServiceError(
  res: Response,
  error: unknown,
): boolean {
  if (!(error instanceof ListingServiceError)) {
    return false;
  }

  res.status(error.statusCode).json({
    status: false,
    message: error.message,
    data: null,
  });

  return true;
}

export async function createListing(
  req: Request,
  res: Response,
): Promise<void> {
  const parsed = createListingSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(422).json({
      status: false,
      message: "Validation failed",
      data: parsed.error.flatten(),
    });
    return;
  }

  try {
    const result = await createNewListing(parsed.data);

    res.status(201).json({
      status: true,
      message: "Listing created successfully",
      data: {
        ...sanitizeListing(result.listing),
        images: sanitizeImages(result.images),
        attributes: sanitizeAttributes(result.attributes),
      },
    });
  } catch (error) {
    if (sendServiceError(res, error)) {
      return;
    }

    throw error;
  }
}

export async function getListings(
  req: Request,
  res: Response,
): Promise<void> {
  const parsed = listingQuerySchema.safeParse(req.query);

  if (!parsed.success) {
    res.status(422).json({
      status: false,
      message: "Validation failed",
      data: parsed.error.flatten(),
    });
    return;
  }

  try {
    const result = await listListings(
      parsed.data.limit,
      parsed.data.cursor,
    );

    res.status(200).json({
      status: true,
      message: "Listings retrieved successfully",
      data: {
        items: result.listings.map(sanitizeListing),
        pagination: {
          limit: parsed.data.limit,
          next_cursor: result.nextCursor,
        },
      },
    });
  } catch (error) {
    if (sendServiceError(res, error)) {
      return;
    }

    throw error;
  }
}

export async function getListing(
  req: Request,
  res: Response,
): Promise<void> {
  const listingId = getListingId(req);

  if (!listingId) {
    res.status(400).json({
      status: false,
      message: "Invalid listing ID",
      data: null,
    });
    return;
  }

  const result = await getListingById(listingId);

  if (!result) {
    res.status(404).json({
      status: false,
      message: "Listing not found",
      data: null,
    });
    return;
  }

  res.status(200).json({
    status: true,
    message: "Listing retrieved successfully",
    data: {
      ...sanitizeListing(result.listing),
      images: sanitizeImages(result.images),
      attributes: sanitizeAttributes(result.attributes),
    },
  });
}

export async function updateListing(
  req: Request,
  res: Response,
): Promise<void> {
  const listingId = getListingId(req);

  if (!listingId) {
    res.status(400).json({
      status: false,
      message: "Invalid listing ID",
      data: null,
    });
    return;
  }

  const parsed = updateListingSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(422).json({
      status: false,
      message: "Validation failed",
      data: parsed.error.flatten(),
    });
    return;
  }

  try {
    const result = await updateExistingListing(
      listingId,
      parsed.data,
    );

    if (!result) {
      res.status(404).json({
        status: false,
        message: "Listing not found",
        data: null,
      });
      return;
    }

    res.status(200).json({
      status: true,
      message: "Listing updated successfully",
      data: {
        ...sanitizeListing(result.listing),
        images: sanitizeImages(result.images),
        attributes: sanitizeAttributes(result.attributes),
      },
    });
  } catch (error) {
    if (sendServiceError(res, error)) {
      return;
    }

    throw error;
  }
}

export async function deleteListing(
  req: Request,
  res: Response,
): Promise<void> {
  const listingId = getListingId(req);

  if (!listingId) {
    res.status(400).json({
      status: false,
      message: "Invalid listing ID",
      data: null,
    });
    return;
  }

  try {
    const listing = await removeListing(listingId);

    if (!listing) {
      res.status(404).json({
        status: false,
        message: "Listing not found",
        data: null,
      });
      return;
    }

    res.status(200).json({
      status: true,
      message: "Listing deleted successfully",
      data: {
        id: listing.id,
        status: listing.status,
      },
    });
  } catch (error) {
    if (sendServiceError(res, error)) {
      return;
    }

    throw error;
  }
}