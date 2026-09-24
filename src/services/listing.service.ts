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
  type ListingRepositoryFilters,
  type UpdateListingInput,
} from "../repositories/listing.repository";

export interface ListingFilters {
  limit: number;
  cursor?: string;

  category_id?: string;
  make?: string;
  model?: string;
  min_price?: number;
  max_price?: number;
  min_year?: number;
  max_year?: number;
  condition?: string;
  transmission?: string;
  fuel_type?: string;
  color?: string;
}

export async function listListings(
  filters: ListingFilters,
): Promise<ListingPage> {
  const decodedCursor = filters.cursor
    ? decodeCursor(filters.cursor)
    : undefined;

  const repositoryFilters: ListingRepositoryFilters = {
    limit: filters.limit,
    cursor: decodedCursor,
    category_id: filters.category_id,
    make: filters.make,
    model: filters.model,
    min_price: filters.min_price,
    max_price: filters.max_price,
    min_year: filters.min_year,
    max_year: filters.max_year,
    condition: filters.condition,
    transmission: filters.transmission,
    fuel_type: filters.fuel_type,
    color: filters.color,
  };

  return findListings(repositoryFilters);
}

export async function createNewListing(
  input: CreateListingInput,
): Promise<{
  listing: Listing;
  images: Awaited<
    ReturnType<typeof findListingImages>
  >;
  attributes: Awaited<
    ReturnType<typeof findListingAttributes>
  >;
}> {
  const listing = await createListing(input);

  if (input.images && input.images.length > 0) {
    await createListingImages(
      listing.id,
      input.images,
    );
  }

  const [images, attributes] =
    await Promise.all([
      findListingImages(listing.id),
      findListingAttributes(listing.id),
    ]);

  return {
    listing,
    images,
    attributes,
  };
}

export async function getListingById(
  id: string,
): Promise<{
  listing: Listing;
  images: Awaited<
    ReturnType<typeof findListingImages>
  >;
  attributes: Awaited<
    ReturnType<typeof findListingAttributes>
  >;
} | null> {
  const listing = await findListingById(id);

  if (!listing) {
    return null;
  }

  const [images, attributes] =
    await Promise.all([
      findListingImages(id),
      findListingAttributes(id),
    ]);

  return {
    listing,
    images,
    attributes,
  };
}

export async function updateExistingListing(
  id: string,
  input: UpdateListingInput,
): Promise<{
  listing: Listing;
  images: Awaited<
    ReturnType<typeof findListingImages>
  >;
  attributes: Awaited<
    ReturnType<typeof findListingAttributes>
  >;
} | null> {
  const listing = await updateListing(
    id,
    input,
  );

  if (!listing) {
    return null;
  }

  const [images, attributes] =
    await Promise.all([
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
  return softDeleteListing(id);
}

export class ListingServiceError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = "ListingServiceError";
  }
}