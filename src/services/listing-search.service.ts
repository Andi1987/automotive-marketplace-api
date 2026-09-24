import {
  decodeSearchCursor,
  searchListings,
  searchListingSuggestions,
  type ListingSearchInput,
  type ListingSearchPage,
  type ListingSearchSuggestionPage,
} from "../repositories/listing-search.repository";

export class ListingSearchServiceError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = "ListingSearchServiceError";
  }
}

export interface SearchListingsInput {
  q?: string;
  make?: string;
  model?: string;
  min_price?: number;
  max_price?: number;
  min_year?: number;
  max_year?: number;
  year?: number;
  mileage_max?: number;
  condition?: "new" | "used";
  transmission?: "automatic" | "manual" | "cvt";
  fuel_type?: "bensin" | "diesel" | "hybrid" | "electric";
  color?: string;
  category_id?: string;

  filter?: Record<string, string>;

  limit: number;
  cursor?: string;
}

export async function searchListing(
  input: SearchListingsInput,
): Promise<ListingSearchPage> {
  let cursor;

  if (input.cursor) {
    try {
      cursor = decodeSearchCursor(input.cursor);
    } catch {
      throw new ListingSearchServiceError(
        "Invalid search cursor",
        400,
      );
    }
  }

  const repositoryInput: ListingSearchInput = {
    q: input.q,
    make: input.make,
    model: input.model,
    min_price: input.min_price,
    max_price: input.max_price,
    min_year: input.min_year,
    max_year: input.max_year,
    year: input.year,
    mileage_max: input.mileage_max,
    condition: input.condition,
    transmission: input.transmission,
    fuel_type: input.fuel_type,
    color: input.color,
    category_id: input.category_id,
    filter: input.filter,
    limit: input.limit,
    cursor,
  };

  return searchListings(repositoryInput);
}

export async function searchListingSuggestion(
  query: string,
): Promise<ListingSearchSuggestionPage> {
  const normalizedQuery = query.trim();

  if (!normalizedQuery) {
    throw new ListingSearchServiceError(
      "Search query is required",
      400,
    );
  }

  return searchListingSuggestions(normalizedQuery, 10);
}