import { randomUUID } from "node:crypto";

import { pool } from "../config/database";

interface CategorySeed {
  id: string;
  parent_id: string | null;
  name: string;
  slug: string;
  description: string;
}

interface FilterAttributeSeed {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  type: "enum" | "range" | "boolean";
  is_filterable: boolean;
}

interface FilterOptionSeed {
  id: string;
  attribute_id: string;
  value: string;
  label: string;
  sort_order: number;
}

interface ListingSeed {
  id: string;
  category_id: string;
  make: string;
  model: string;
  year: number;
  mileage: number;
  price: number;
  condition: "new" | "used";
  transmission: "automatic" | "manual" | "cvt";
  fuel_type: "bensin" | "diesel" | "hybrid" | "electric";
  color: string;
  location: string;
  description: string;
  status: "available" | "pending" | "sold";
  engine_capacity: number;
  sunroof: boolean;
}

const categoryDefinitions = [
  {
    name: "Cars",
    slug: "cars",
    description: "Passenger and commercial cars",
    children: [
      {
        name: "SUV",
        slug: "cars-suv",
        description: "Sport utility vehicles",
      },
      {
        name: "Sedan",
        slug: "cars-sedan",
        description: "Sedan passenger cars",
      },
      {
        name: "Hatchback",
        slug: "cars-hatchback",
        description: "Compact hatchback cars",
      },
    ],
  },
  {
    name: "Motorcycles",
    slug: "motorcycles",
    description: "Motorcycles and scooters",
    children: [
      {
        name: "Sport",
        slug: "motorcycles-sport",
        description: "Sport motorcycles",
      },
      {
        name: "Scooter",
        slug: "motorcycles-scooter",
        description: "Automatic scooters",
      },
      {
        name: "Cruiser",
        slug: "motorcycles-cruiser",
        description: "Cruiser motorcycles",
      },
    ],
  },
];

const filterDefinitions = [
  {
    name: "Transmission",
    slug: "transmission",
    type: "enum" as const,
    options: [
      ["automatic", "Automatic"],
      ["manual", "Manual"],
      ["cvt", "CVT"],
    ],
  },
  {
    name: "Fuel Type",
    slug: "fuel_type",
    type: "enum" as const,
    options: [
      ["bensin", "Bensin"],
      ["diesel", "Diesel"],
      ["hybrid", "Hybrid"],
      ["electric", "Electric"],
    ],
  },
  {
    name: "Condition",
    slug: "condition",
    type: "enum" as const,
    options: [
      ["new", "New"],
      ["used", "Used"],
    ],
  },
  {
    name: "Color",
    slug: "color",
    type: "enum" as const,
    options: [
      ["black", "Black"],
      ["white", "White"],
      ["silver", "Silver"],
      ["gray", "Gray"],
      ["red", "Red"],
      ["blue", "Blue"],
    ],
  },
  {
    name: "Engine Capacity",
    slug: "engine_capacity",
    type: "range" as const,
    options: [],
  },
  {
    name: "Sunroof",
    slug: "sunroof",
    type: "boolean" as const,
    options: [],
  },
];

const carModels = [
  {
    make: "Toyota",
    models: ["Innova Reborn", "Fortuner", "Avanza", "Rush"],
  },
  {
    make: "Honda",
    models: ["CR-V", "HR-V", "Brio", "Civic"],
  },
  {
    make: "Mitsubishi",
    models: ["Pajero Sport", "Xpander", "Outlander"],
  },
  {
    make: "Suzuki",
    models: ["Ertiga", "XL7", "Baleno"],
  },
  {
    make: "Daihatsu",
    models: ["Terios", "Xenia", "Rocky"],
  },
];

const motorcycleModels = [
  {
    make: "Honda",
    models: ["Vario 160", "PCX 160", "CBR 250RR", "CB150R"],
  },
  {
    make: "Yamaha",
    models: ["NMAX", "Aerox", "R15", "MT-15"],
  },
  {
    make: "Kawasaki",
    models: ["Ninja 250", "Ninja 400", "W175"],
  },
  {
    make: "Suzuki",
    models: ["GSX-R150", "GSX-S150", "Burgman Street"],
  },
];

const locations = [
  "Jakarta",
  "Bandung",
  "Bekasi",
  "Depok",
  "Tangerang",
  "Bogor",
  "Surabaya",
  "Semarang",
  "Yogyakarta",
  "Medan",
];

const colors = [
  "black",
  "white",
  "silver",
  "gray",
  "red",
  "blue",
] as const;

const transmissions = [
  "automatic",
  "manual",
  "cvt",
] as const;

const fuelTypes = [
  "bensin",
  "diesel",
  "hybrid",
  "electric",
] as const;

const conditions = [
  "new",
  "used",
] as const;

const carEngineCapacities = [
  1000,
  1200,
  1300,
  1500,
  1800,
  2000,
  2400,
  2500,
] as const;

const motorcycleEngineCapacities = [
  110,
  125,
  150,
  155,
  160,
  175,
  250,
  400,
] as const;

function pick<T>(items: readonly T[], index: number): T {
  return items[index % items.length];
}

function buildCategories(): CategorySeed[] {
  const categories: CategorySeed[] = [];

  for (const root of categoryDefinitions) {
    const rootId = randomUUID();

    categories.push({
      id: rootId,
      parent_id: null,
      name: root.name,
      slug: root.slug,
      description: root.description,
    });

    for (const child of root.children) {
      categories.push({
        id: randomUUID(),
        parent_id: rootId,
        name: child.name,
        slug: child.slug,
        description: child.description,
      });
    }
  }

  return categories;
}

async function seedCategories(
  client: import("pg").PoolClient,
  categories: CategorySeed[],
): Promise<void> {
  for (const category of categories) {
    await client.query(
      `
        INSERT INTO categories (
          id,
          parent_id,
          name,
          slug,
          description,
          is_active
        )
        VALUES ($1, $2, $3, $4, $5, TRUE)
      `,
      [
        category.id,
        category.parent_id,
        category.name,
        category.slug,
        category.description,
      ],
    );
  }
}

async function seedFilterAttributes(
  client: import("pg").PoolClient,
  categories: CategorySeed[],
): Promise<{
  attributes: FilterAttributeSeed[];
  options: FilterOptionSeed[];
}> {
  const attributes: FilterAttributeSeed[] = [];
  const options: FilterOptionSeed[] = [];

  for (const category of categories) {
    for (const definition of filterDefinitions) {
      const attributeId = randomUUID();

      attributes.push({
        id: attributeId,
        category_id: category.id,
        name: definition.name,
        slug: definition.slug,
        type: definition.type,
        is_filterable: true,
      });

      for (
        let optionIndex = 0;
        optionIndex < definition.options.length;
        optionIndex++
      ) {
        const [value, label] = definition.options[optionIndex];

        options.push({
          id: randomUUID(),
          attribute_id: attributeId,
          value,
          label,
          sort_order: optionIndex,
        });
      }
    }
  }

  for (const attribute of attributes) {
    await client.query(
      `
        INSERT INTO filter_attributes (
          id,
          category_id,
          name,
          slug,
          type,
          is_filterable
        )
        VALUES ($1, $2, $3, $4, $5, $6)
      `,
      [
        attribute.id,
        attribute.category_id,
        attribute.name,
        attribute.slug,
        attribute.type,
        attribute.is_filterable,
      ],
    );
  }

  for (const option of options) {
    await client.query(
      `
        INSERT INTO filter_attribute_options (
          id,
          attribute_id,
          value,
          label,
          sort_order
        )
        VALUES ($1, $2, $3, $4, $5)
      `,
      [
        option.id,
        option.attribute_id,
        option.value,
        option.label,
        option.sort_order,
      ],
    );
  }

  return {
    attributes,
    options,
  };
}

function buildListings(
  categories: CategorySeed[],
): ListingSeed[] {
  const listingCategories = categories.filter(
    (category) => category.parent_id !== null,
  );

  const listings: ListingSeed[] = [];

  for (let index = 0; index < 500; index++) {
    const category = pick(listingCategories, index);

    const isCar = category.slug.startsWith("cars-");

    const vehicleGroup = isCar
      ? pick(carModels, index)
      : pick(motorcycleModels, index);

    const model = pick(vehicleGroup.models, index);

    const condition = pick(conditions, index);
    let transmission = pick(transmissions, index);

    if (category.slug === "motorcycles-scooter") {
      transmission = "automatic";
    }

    let fuelType = pick(fuelTypes, index);

    if (!isCar && fuelType === "diesel") {
      fuelType = "bensin";
    }

    const year =
      condition === "new"
        ? 2024 + (index % 3)
        : 2017 + (index % 8);

    const mileage =
      condition === "new"
        ? index % 5000
        : 5000 + ((index * 1379) % 95000);

    const basePrice = isCar
      ? 180_000_000 + ((index * 17_500_000) % 750_000_000)
      : 18_000_000 + ((index * 3_750_000) % 180_000_000);

    const price =
      condition === "new"
        ? basePrice + 25_000_000
        : basePrice;

    const color = pick(colors, index);
    const location = pick(locations, index);

    const engineCapacity = isCar
      ? pick(carEngineCapacities, index)
      : pick(motorcycleEngineCapacities, index);

    const sunroof =
      isCar
        ? index % 4 === 0
        : false;

    listings.push({
      id: randomUUID(),
      category_id: category.id,
      make: vehicleGroup.make,
      model,
      year,
      mileage,
      price,
      condition,
      transmission,
      fuel_type: fuelType,
      color,
      location,
      description:
        `${vehicleGroup.make} ${model} ${year} ${condition} ` +
        `with ${transmission} transmission and ${fuelType} fuel. ` +
        `Located in ${location}.`,
      status:
        index % 25 === 0
          ? "pending"
          : index % 40 === 0
            ? "sold"
            : "available",
      engine_capacity: engineCapacity,
      sunroof,
    });
  }

  return listings;
}

async function seedListings(
  client: import("pg").PoolClient,
  listings: ListingSeed[],
): Promise<void> {
  for (const listing of listings) {
    await client.query(
      `
        INSERT INTO listings (
          id,
          seller_id,
          category_id,
          make,
          model,
          year,
          mileage,
          price,
          condition,
          transmission,
          fuel_type,
          color,
          location,
          description,
          status
        )
        VALUES (
          $1,
          NULL,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7,
          $8,
          $9,
          $10,
          $11,
          $12,
          $13,
          $14
        )
      `,
      [
        listing.id,
        listing.category_id,
        listing.make,
        listing.model,
        listing.year,
        listing.mileage,
        listing.price,
        listing.condition,
        listing.transmission,
        listing.fuel_type,
        listing.color,
        listing.location,
        listing.description,
        listing.status,
      ],
    );
  }
}

async function seedListingAttributes(
  client: import("pg").PoolClient,
  listings: ListingSeed[],
  attributes: FilterAttributeSeed[],
  options: FilterOptionSeed[],
): Promise<number> {
  let insertedCount = 0;

  for (const listing of listings) {
    const categoryAttributes = attributes.filter(
      (attribute) =>
        attribute.category_id === listing.category_id &&
        attribute.is_filterable,
    );

    for (const attribute of categoryAttributes) {
      if (attribute.type === "enum") {
        let value: string;

        switch (attribute.slug) {
          case "transmission":
            value = listing.transmission;
            break;

          case "fuel_type":
            value = listing.fuel_type;
            break;

          case "condition":
            value = listing.condition;
            break;

          case "color":
            value = listing.color;
            break;

          default:
            continue;
        }

        const option = options.find(
          (item) =>
            item.attribute_id === attribute.id &&
            item.value === value,
        );

        if (!option) {
          throw new Error(
            `Filter option not found: ${attribute.slug}=${value}`,
          );
        }

        await client.query(
          `
            INSERT INTO listing_attribute_values (
              id,
              listing_id,
              attribute_id,
              option_id,
              value_text,
              value_number,
              value_boolean
            )
            VALUES ($1, $2, $3, $4, NULL, NULL, NULL)
          `,
          [
            randomUUID(),
            listing.id,
            attribute.id,
            option.id,
          ],
        );

        insertedCount++;
        continue;
      }

      if (attribute.type === "range") {
        if (attribute.slug !== "engine_capacity") {
          continue;
        }

        await client.query(
          `
            INSERT INTO listing_attribute_values (
              id,
              listing_id,
              attribute_id,
              option_id,
              value_text,
              value_number,
              value_boolean
            )
            VALUES ($1, $2, $3, NULL, NULL, $4, NULL)
          `,
          [
            randomUUID(),
            listing.id,
            attribute.id,
            listing.engine_capacity,
          ],
        );

        insertedCount++;
        continue;
      }

      if (attribute.type === "boolean") {
        if (attribute.slug !== "sunroof") {
          continue;
        }

        await client.query(
          `
            INSERT INTO listing_attribute_values (
              id,
              listing_id,
              attribute_id,
              option_id,
              value_text,
              value_number,
              value_boolean
            )
            VALUES ($1, $2, $3, NULL, NULL, NULL, $4)
          `,
          [
            randomUUID(),
            listing.id,
            attribute.id,
            listing.sunroof,
          ],
        );

        insertedCount++;
      }
    }
  }

  return insertedCount;
}

async function seedListingImages(
  client: import("pg").PoolClient,
  listings: ListingSeed[],
): Promise<number> {
  let insertedCount = 0;

  for (const listing of listings) {
    for (let imageIndex = 1; imageIndex <= 2; imageIndex++) {
      await client.query(
        `
          INSERT INTO listing_images (
            id,
            listing_id,
            image_url,
            sort_order
          )
          VALUES ($1, $2, $3, $4)
        `,
        [
          randomUUID(),
          listing.id,
          `https://placehold.co/1200x800?text=${encodeURIComponent(
            `${listing.make} ${listing.model} ${imageIndex}`,
          )}`,
          imageIndex - 1,
        ],
      );

      insertedCount++;
    }
  }

  return insertedCount;
}

async function seed(): Promise<void> {
  const client = await pool.connect();

  try {
    console.log("Starting database seed...");

    await client.query("BEGIN");

    await client.query(`
      TRUNCATE TABLE
        listing_images,
        listing_attribute_values,
        listings,
        filter_attribute_options,
        filter_attributes,
        categories
      RESTART IDENTITY CASCADE;
    `);

    const categories = buildCategories();

    await seedCategories(
      client,
      categories,
    );

    const {
      attributes,
      options,
    } = await seedFilterAttributes(
      client,
      categories,
    );

    const listings = buildListings(
      categories,
    );

    await seedListings(
      client,
      listings,
    );

    const attributeValueCount =
      await seedListingAttributes(
        client,
        listings,
        attributes,
        options,
      );

    const imageCount =
      await seedListingImages(
        client,
        listings,
      );

    await client.query("COMMIT");

    console.log("");
    console.log("✓ Database seed completed successfully.");
    console.log("");
    console.log(`Categories: ${categories.length}`);
    console.log(`Filter attributes: ${attributes.length}`);
    console.log(`Filter options: ${options.length}`);
    console.log(`Listings: ${listings.length}`);
    console.log(
      `Listing attribute values: ${attributeValueCount}`,
    );
    console.log(`Listing images: ${imageCount}`);
    console.log("");
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Seed failed:", error);

    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

void seed().catch((error) => {
  console.error("Database seed failed:", error);
  process.exit(1);
});