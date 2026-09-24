import {
  createListing,
  createListingImages,
  decodeCursor,
  findListingAttributes,
  findListingById,
  findListingImages,
  findListings,
  softDeleteListing,
  updateListing,
  type CreateListingInput,
  type Listing,
  type ListingPage,
  type UpdateListingInput,
} from "../repositories/listing.repository";

import {
  findCategoryById,
} from "../repositories/category.repository";


export class ListingServiceError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = "ListingServiceError";
  }
}

export interface ListingDetail {
  listing: Listing;
  images: Awaited<ReturnType<typeof findListingImages>>;
  attributes: Awaited<ReturnType<typeof findListingAttributes>>;
}

export async function createNewListing(
  input: CreateListingInput,
): Promise<ListingDetail> {
  const category = await findCategoryById(input.category_id);

  if (!category) {
    throw new ListingServiceError(
      "Category not found",
      404,
    );
  }

  if (!category.is_active) {
    throw new ListingServiceError(
      "Category is inactive",
      409,
    );
  }

  const listing = await createListing(input);

  let images: Awaited<ReturnType<typeof findListingImages>> = [];

  if (input.images && input.images.length > 0) {
    images = await createListingImages(
      listing.id,
      input.images,
    );
  }

  return {
    listing,
    images,
    attributes: [],
  };
}

export async function getListingById(
  id: string,
): Promise<ListingDetail | null> {
  const listing = await findListingById(id);

  if (!listing) {
    return null;
  }

  const [images, attributes] = await Promise.all([
    findListingImages(id),
    findListingAttributes(id),
  ]);

  return {
    listing,
    images,
    attributes,
  };
}

export async function listListings(
  limit: number,
  cursor?: string,
): Promise<ListingPage> {
  let decodedCursor;

  if (cursor) {
    try {
      decodedCursor = decodeCursor(cursor);
    } catch {
      throw new ListingServiceError(
        "Invalid cursor",
        400,
      );
    }
  }

  return findListings(
    limit,
    decodedCursor,
  );
}

export async function updateExistingListing(
  id: string,
  input: UpdateListingInput,
): Promise<ListingDetail | null> {
  const existingListing = await findListingById(id);

  if (!existingListing) {
    return null;
  }

  if (existingListing.status === "removed") {
    throw new ListingServiceError(
      "Removed listing cannot be updated",
      409,
    );
  }

  if (input.category_id !== undefined) {
    const category = await findCategoryById(
      input.category_id,
    );

    if (!category) {
      throw new ListingServiceError(
        "Category not found",
        404,
      );
    }

    if (!category.is_active) {
      throw new ListingServiceError(
        "Category is inactive",
        409,
      );
    }
  }

  const listing = await updateListing(
    id,
    input,
  );

  if (!listing) {
    return null;
  }

  const [images, attributes] = await Promise.all([
    findListingImages(id),
    findListingAttributes(id),
  ]);

  return {
    listing,
    images,
    attributes,
  };
}

export async function removeListing(
  id: string,
): Promise<Listing | null> {
  const listing = await findListingById(id);

  if (!listing) {
    return null;
  }

  if (listing.status === "removed") {
    throw new ListingServiceError(
      "Listing has already been removed",
      409,
    );
  }

  return softDeleteListing(id);
}