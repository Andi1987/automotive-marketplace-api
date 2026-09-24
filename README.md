# Automotive Marketplace API

REST API backend for an automotive marketplace platform.

This API is designed to manage vehicle listings, vehicle categories, dynamic filters, full-text search, multi-filter combinations, cursor-based pagination, and relational data using PostgreSQL.

---

## 1. Technologies Used

* Node.js
* TypeScript
* Express.js
* PostgreSQL
* `pg` PostgreSQL driver
* Zod for request validation
* Raw SQL
* OpenAPI

The application uses PostgreSQL as its database and the `pg` library to execute SQL queries directly.

---

## 2. Features

### Vehicle Listings

The API provides the following features:

* Create vehicle listings
* Retrieve listing collections
* Retrieve listing details
* Update listings
* Soft delete listings
* Listing images
* Dynamic listing attributes
* Filtering and sorting
* Cursor-based pagination

Listing statuses:

* `available`
* `pending`
* `sold`
* `removed`

---

### Categories

Vehicle categories use a hierarchical category structure.

Example:

```text
Cars
 -  SUV
 - Sedan
 - Hatchback

Motorcycles
 - Cruiser
 - Scooter
 - Sport
```

The category hierarchy uses `parent_id`, which references `categories.id`.

This approach allows the database to support categories with arbitrary depth without being limited by a fixed number of category levels.

The API also supports:

* Retrieve category collections
* Retrieve category details
* Retrieve listings by category
* Create categories
* Update categories
* Recursive category queries

---

### Dynamic Filter

Dynamic filters allow each category to have its own set of filter attributes.

Supported filter types:

* Enum
* Range
* Boolean

Example:

```text
Cars
 - Transmission
 - Fuel Type
 - Engine Capacity
 - Color

Motorcycles
 - Transmission
 - Fuel Type
 - Engine Capacity
 - Color
```

Filter definitions are stored in tables separate from the `listings` table.

This approach allows new filters to be added without modifying the main `listings` table structure.

---

### Search

Full-text search uses PostgreSQL `tsvector`.

The search vector is built from:

* `make`
* `model`
* `description`
* `location`

The search vector uses a **GIN index** to improve text search performance.

Search also supports combinations of multiple filters in a single request:

* Text search
* Category
* Status
* Condition
* Transmission
* Fuel type
* Price
* Year
* Dynamic enum filter
* Dynamic range filter
* Dynamic boolean filter

Dynamic filters use SQL `EXISTS`, allowing multiple dynamic filters to be applied simultaneously.

---

### Cursor Pagination

The browse and search endpoints use cursor-based pagination.

Cursor pagination was chosen to reduce dependency on `OFFSET` as the dataset grows.

Pagination uses a combination of:

```text
created_at
id
```

as the cursor to maintain consistent and deterministic ordering.

---

### Data Seeding

The project provides seed data for testing and demonstration purposes.

Generated data:

* 8 categories
* 48 filter attributes
* 120 filter options
* 500 listings
* 3,000 dynamic attribute values
* 1,000 listing images

The dataset covers multiple vehicle categories, including cars and motorcycles.

---

## 3. Architecture

The application uses a **Layered Architecture** approach.

Request flow:

```text
HTTP Request -> Routes -> Controllers -> Services -> Repositories -> PostgreSQL
```

### Routes

Define HTTP endpoints and routing.

### Controllers

Handle HTTP requests and HTTP responses.

### Services

Handle business logic and application logic.

### Repositories

Handle database access using raw SQL.

This separation keeps HTTP logic, business logic, and database logic separated, making the application easier to develop, maintain, and extend.

---

## 4. Database Schema

The database uses a relational model with the following main entities:

```text
users

categories

listings

listing_images

filter_attributes

filter_attribute_options

listing_attribute_values
```

### ERD

The ERD was created using **dbdiagram.io**.

ERD source:

```text
docs/erd.dbml
```

The file can be used to view and further develop the database structure visually.

---

## 5. Indexing & Query Optimization

Indexes are created based on the query patterns used by the application.

### Listings

Indexes include:

```text
idx_listings_category_id

idx_listings_status

idx_listings_created_at

idx_listings_category_status_created_at

idx_listings_search_vector
```

Composite indexes are used for queries that frequently combine multiple conditions, particularly category, status, and pagination.

### Dynamic Numeric Filter

Numeric filters use the following index:

```text
(attribute_id, value_number)
```

This index helps queries such as:

```text
engine_capacity >= 1500
price range
year range
```

### Dynamic Boolean Filter

Boolean filters use the following index:

```text
(attribute_id, value_boolean)
```

### Query Testing

Query performance was tested using `EXPLAIN ANALYZE` for several key use cases:

* Listing browse
* Category listing
* Full-text search
* Numeric filtering
* Boolean filtering
* Multi-filter search

Indexes are not created for every possible filter combination because the number of combinations can become extremely large.

Instead, indexes are created based on the most common query patterns.

---

## 6. Soft Delete

Listings are not physically deleted from the database.

When the delete endpoint is called, the listing status is changed to:

```text
removed
```

Listings with `removed` status are excluded from:

* Listing browse
* Search
* Category listing

This approach keeps listing data available in the database for auditing purposes and potential future features.

---

## 7. Validation

Request validation uses **Zod**.

Validation covers:

* Required fields
* UUID
* Numeric values
* Enum values
* Price
* Year
* Mileage
* Category
* Listing attributes

If the request is invalid, the API returns:

```text
422 Unprocessable Entity
```

---

## 8. API Response

The API uses a consistent response format.

### Success Response

```json
{
  "status": true,
  "message": "Success",
  "data": {}
}
```

### Error Response

```json
{
  "status": false,
  "message": "Error message",
  "data": null
}
```

HTTP status codes used:

* `200 OK`
* `201 Created`
* `204 No Content`
* `404 Not Found`
* `409 Conflict`
* `422 Unprocessable Entity`

---

## 9. API Endpoints

### Health

```text
GET /health

GET /health/db
```

### Listings

```text
POST   /api/v1/listings

GET    /api/v1/listings

GET    /api/v1/listings/:id

PATCH  /api/v1/listings/:id

DELETE /api/v1/listings/:id
```

### Search

```text
GET /api/v1/listings/search

GET /api/v1/listings/search/suggest
```

### Categories

```text
GET    /api/v1/categories

GET    /api/v1/categories/:id

GET    /api/v1/categories/:id/listings

POST   /api/v1/categories

PATCH  /api/v1/categories/:id
```

### Filters

```text
GET /api/v1/filters

GET /api/v1/filters/:categoryId
```

---

## 10. API Documentation

OpenAPI specification:

```text
docs/openapi.yaml
```

### Swagger UI

Swagger UI can be used to view and test the API endpoints.

Production:

[https://automotive-marketplace-api.vercel.app/api/docs]

Local:

[http://localhost:3000/api/docs]

---

## 11. Live API

The API is available in the production environment.

### Base URL

[https://automotive-marketplace-api.vercel.app]

### Health Check

[https://automotive-marketplace-api.vercel.app/health]

### Database Health Check

[https://automotive-marketplace-api.vercel.app/health/db]

### Swagger Documentation

[https://automotive-marketplace-api.vercel.app/api/docs]

---

## 12. Environment

Create a `.env` file based on `.env.example`.

Example:

```env
PORT=3000

DATABASE_URL=postgresql://postgres:password@localhost:5432/automotive_marketplace_db

NODE_ENV=development
```

`DATABASE_URL` must be configured according to the PostgreSQL instance being used.

---

## 13. Installation

Clone the repository:

```bash
git clone git@github.com:Andi1987/automotive-marketplace-api.git

cd automotive-marketplace-api
```

Install dependencies:

```bash
npm install
```

Create the `.env` file:

```bash
cp .env.example .env
```

Update the database configuration in `.env`.

---

## 14. Migration

Make sure PostgreSQL is running.

Run the migration:

```bash
npm run migrate
```

The migration creates all tables and indexes required by the application.

---

## 15. Seed Database

After the migration is complete, run:

```bash
npm run seed
```

The seed script creates sample data for testing and demonstration.

Generated data:

```text
8 categories

48 filter attributes

120 filter options

500 listings

3,000 dynamic attribute values

1,000 listing images
```

---

## 16. Running the Application

### Development

```bash
npm run dev
```

### Type Check

```bash
npm run typecheck
```

### Build

```bash
npm run build
```

### Production

```bash
npm start
```

Default local API:

[http://localhost:3000]

### Health Check

```text
GET /health
```

[http://localhost:3000/health]

### Database Health Check

```text
GET /health/db
```

[http://localhost:3000/health/db]

---

## 17. Technical Decisions

### Raw SQL

Database access uses `pg` and raw SQL.

The main reason is to maintain direct control over database queries, particularly for:

* Complex filtering
* Full-text search
* Dynamic attributes
* Cursor pagination
* Index optimization

### Layered Architecture

Routes, controllers, services, and repositories are separated so that each layer has a clear responsibility.

### PostgreSQL Full-Text Search

PostgreSQL `tsvector` is used for full-text search, allowing search operations to be performed directly in the database without requiring an additional search engine.

### Dynamic Attributes

Dynamic attributes are separated from the `listings` table so that new filters can be introduced without modifying the main listing schema.

### Cursor Pagination

Cursor pagination is used to avoid relying on large `OFFSET` values as the dataset grows.

### Soft Delete

Listings use the `removed` status instead of physically deleting database rows.

This approach keeps listing data available in the database for auditing and potential future features.

---

## 18. Deployment

Application deployment uses:

```text
Vercel
```

The production database uses:

```text
Neon PostgreSQL
```

Production API:

[https://automotive-marketplace-api.vercel.app]

---

## 19. Repository

The project source code is available on GitHub:

[https://github.com/Andi1987/automotive-marketplace-api]

---

## 20. Notes

This project was developed as a backend REST API for an automotive marketplace assessment and to demonstrate the implementation of a production-oriented marketplace backend.

The main focus of the project is:

* Relational database design
* REST API
* Layered architecture
* Raw SQL
* Dynamic filtering
* Full-text search
* Cursor pagination
* Indexing
* Validation
* API documentation
* Database seeding
* Production deployment
