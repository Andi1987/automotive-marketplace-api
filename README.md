# Automotive Marketplace API

REST API backend untuk platform marketplace otomotif.

API ini dirancang untuk mengelola listing kendaraan, kategori kendaraan, dynamic filter, full-text search, kombinasi filter, cursor-based pagination, dan data relasional menggunakan PostgreSQL.

---

## 1. Teknologi yang Digunakan

* Node.js
* TypeScript
* Express.js
* PostgreSQL
* `pg` PostgreSQL driver
* Zod untuk validasi request
* Raw SQL
* OpenAPI

Aplikasi menggunakan PostgreSQL sebagai database dan library `pg` untuk menjalankan query SQL secara langsung.

---

## 2. Fitur

### Listing Kendaraan

API menyediakan fitur:

* Membuat listing kendaraan
* Menampilkan daftar listing
* Menampilkan detail listing
* Mengubah listing
* Soft delete listing
* Listing images
* Dynamic listing attributes
* Filtering dan sorting
* Cursor-based pagination

Status listing yang digunakan:

* `available`
* `pending`
* `sold`
* `removed`

---

### Categories

Kategori kendaraan menggunakan struktur hierarchical category.

Contoh struktur:

Cars
 - SUV
 - Sedan
 - Hatchback

Motorcycles
 - Cruiser
 - Scooter
 - Sport

Struktur kategori menggunakan `parent_id` yang mengarah ke `categories.id`.

Dengan pendekatan ini, database dapat menyimpan kategori dengan kedalaman yang tidak dibatasi oleh struktur tabel.

API juga mendukung:

* Menampilkan daftar kategori
* Menampilkan detail kategori
* Menampilkan listing berdasarkan kategori
* Membuat kategori
* Mengubah kategori
* Query kategori secara rekursif

---

### Dynamic Filter

Dynamic filter digunakan agar setiap kategori dapat memiliki filter yang berbeda.

Jenis filter yang didukung:

* Enum
* Range
* Boolean

Contoh:

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


Definisi filter disimpan pada tabel terpisah dari tabel `listings`.

Dengan pendekatan ini, filter baru dapat ditambahkan tanpa harus mengubah struktur utama tabel `listings`.

---

### Search

Full-text search menggunakan PostgreSQL `tsvector`.

Search vector dibentuk dari:

* `make`
* `model`
* `description`
* `location`

Search vector menggunakan **GIN index** untuk membantu pencarian text.

Search juga mendukung kombinasi beberapa filter dalam satu request:

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

Dynamic filter menggunakan SQL `EXISTS`, sehingga beberapa dynamic filter dapat digunakan secara bersamaan.

---

### Cursor Pagination

Endpoint browse dan search menggunakan cursor-based pagination.

Cursor pagination dipilih untuk mengurangi ketergantungan terhadap `OFFSET` ketika jumlah data semakin besar.

Pagination menggunakan kombinasi:

created_at
id

sebagai cursor untuk menjaga urutan data tetap konsisten.

---

### Data Seeding

Project menyediakan seed data untuk kebutuhan testing dan demonstrasi.

Data yang dibuat:

* 8 kategori
* 48 filter attributes
* 120 filter options
* 500 listings
* 3.000 dynamic attribute values
* 1.000 listing images

Data mencakup beberapa kategori kendaraan, termasuk mobil dan sepeda motor.

---

## 3. Arsitektur

Aplikasi menggunakan pendekatan **Layered Architecture**.

Alur request:

HTTP Request -> Routes -> Controllers -> Services -> Repositories -> PostgreSQL

### Routes

Menentukan endpoint dan routing HTTP.

### Controllers

Menangani HTTP request dan HTTP response.

### Services

Menangani business logic dan application logic.

### Repositories

Menangani akses database menggunakan raw SQL.

Pemisahan layer ini membuat HTTP logic, business logic, dan database logic tetap terpisah sehingga lebih mudah dikembangkan dan dipelihara.

---

## 4. Database Schema

Database menggunakan relational database dengan beberapa entity utama:

users  -> Additional
categories
listings
listing_images
filter_attributes
filter_attribute_options
listing_attribute_values


### ERD

ERD dibuat menggunakan **dbdiagram.io**.

Source ERD:

docs/erd.dbml

File tersebut dapat digunakan untuk melihat dan mengembangkan struktur database secara visual.

---

## 5. Indexing & Query Optimization

Index dibuat berdasarkan pola query yang digunakan oleh aplikasi.

### Listings

Index yang digunakan antara lain:

idx_listings_category_id
idx_listings_status
idx_listings_created_at
idx_listings_category_status_created_at
idx_listings_search_vector

Composite index digunakan untuk query yang sering menggabungkan beberapa kondisi, terutama category, status, dan pagination.

### Dynamic Numeric Filter

Untuk numeric filter digunakan index:

(attribute_id, value_number)


Index ini membantu query seperti:

engine_capacity >= 1500
price range
year range


### Dynamic Boolean Filter

Untuk boolean filter digunakan index:

(attribute_id, value_boolean)


### Query yang Diuji

Query performance diuji menggunakan `EXPLAIN ANALYZE` untuk beberapa kebutuhan utama:

* Browse listing
* Category listing
* Full-text search
* Numeric filter
* Boolean filter
* Multi-filter search

Index tidak dibuat untuk setiap kemungkinan kombinasi filter karena jumlah kombinasi dapat menjadi sangat besar.

Index dibuat berdasarkan pola query yang paling umum digunakan.

---

## 6. Soft Delete

Listing tidak dihapus secara fisik dari database.

Ketika endpoint delete dipanggil, status listing diubah menjadi:

removed

Listing dengan status `removed` tidak ditampilkan pada:

* Browse listing
* Search
* Category listing

Dengan pendekatan ini, data listing tetap tersedia di database dan dapat digunakan untuk kebutuhan audit atau pengembangan fitur berikutnya.

---

## 7. Validation

Request validation menggunakan **Zod**.

Validasi mencakup:

* Required field
* UUID
* Numeric value
* Enum
* Price
* Year
* Mileage
* Category
* Listing attributes

Jika request tidak valid, API mengembalikan:

422 Unprocessable Entity

---

## 8. API Response

API menggunakan format response yang konsisten.

### Success Response

json
{
  "status": true,
  "message": "Success",
  "data": {}
}


### Error Response

json
{
  "status": false,
  "message": "Error message",
  "data": null
}


HTTP status yang digunakan:

* `200 OK`
* `201 Created`
* `204 No Content`
* `404 Not Found`
* `409 Conflict`
* `422 Unprocessable Entity`

---

## 9. API Endpoint

### Health

GET /health
GET /health/db

### Listings

POST   /api/v1/listings
GET    /api/v1/listings
GET    /api/v1/listings/:id
PATCH  /api/v1/listings/:id
DELETE /api/v1/listings/:id

### Search

GET /api/v1/listings/search
GET /api/v1/listings/search/suggest

### Categories

GET    /api/v1/categories
GET    /api/v1/categories/:id
GET    /api/v1/categories/:id/listings
POST   /api/v1/categories
PATCH  /api/v1/categories/:id

### Filters

GET /api/v1/filters
GET /api/v1/filters/:categoryId

---

## 10. API Documentation

OpenAPI specification:

docs/openapi.yaml

### Swagger UI

Swagger UI dapat digunakan untuk melihat dan mencoba endpoint API.

Production:

https://automotive-marketplace-api.vercel.app/api/docs


Local:

http://localhost:3000/api/docs


---

## 11. Live API

API sudah tersedia pada environment production.

### Base URL

https://automotive-marketplace-api.vercel.app


### Health Check

https://automotive-marketplace-api.vercel.app/health


### Database Health Check

https://automotive-marketplace-api.vercel.app/health/db


### Swagger Documentation

https://automotive-marketplace-api.vercel.app/api/docs

---

## 12. Environment

Buat file `.env` berdasarkan `.env.example`.

Contoh:

PORT=3000
DATABASE_URL=postgresql://postgres:password@localhost:5432/automotive_marketplace_db
NODE_ENV=development


`DATABASE_URL` harus disesuaikan dengan PostgreSQL yang digunakan.

---

## 13. Instalasi

Clone repository:

bash
git clone https://github.com/Andi1987/automotive-marketplace-api.git
cd automotive-marketplace-api

Install dependency:

bash
npm install

Buat file `.env`:

bash
cp .env.example .env

Sesuaikan konfigurasi database pada `.env`.

---

## 14. Migration

Pastikan PostgreSQL sudah running.

Jalankan migration:

bash
npm run migrate


Migration akan membuat seluruh tabel dan index yang dibutuhkan oleh aplikasi.

---

## 15. Seed Database

Setelah migration selesai, jalankan:

bash
npm run seed

Seed akan membuat data contoh untuk kebutuhan testing.

Data yang dihasilkan:

8 categories
48 filter attributes
120 filter options
500 listings
3,000 dynamic attribute values
1,000 listing images

---

## 16. Running Application

### Development

bash
npm run dev

### Type Check

bash
npm run typecheck

### Build

bash
npm run build

### Production

bash
npm start

Default local API:

http://localhost:3000


### Health Check

GET http://localhost:3000/health


### Database Health Check

GET http://localhost:3000/health/db

---

## 17. Technical Decisions

### Raw SQL

Database access dilakukan menggunakan `pg` dan raw SQL.

Alasannya adalah agar query database dapat dikontrol secara langsung, terutama untuk kebutuhan:

* Complex filtering
* Full-text search
* Dynamic attributes
* Cursor pagination
* Index optimization

### Layered Architecture

Routes, controllers, services, dan repositories dipisahkan agar setiap layer memiliki tanggung jawab yang jelas.

### PostgreSQL Full-Text Search

PostgreSQL `tsvector` digunakan untuk kebutuhan full-text search sehingga pencarian dapat dilakukan langsung pada database tanpa membutuhkan search engine tambahan.

### Dynamic Attributes

Dynamic attributes dipisahkan dari tabel `listings` agar penambahan filter baru tidak memerlukan perubahan schema utama.

### Cursor Pagination

Cursor pagination digunakan untuk menghindari penggunaan `OFFSET` besar ketika dataset berkembang.

### Soft Delete

Listing menggunakan status `removed` daripada menghapus row secara fisik.

Pendekatan ini menjaga data tetap tersedia di database.

---

## 18. Deployment

Application deployment menggunakan:

Vercel

Database production menggunakan:

Neon PostgreSQL

Production API:

https://automotive-marketplace-api.vercel.app

---

## 19. Repository

Source code project tersedia di GitHub:

https://github.com/Andi1987/automotive-marketplace-api

---

## 20. Notes

Project ini dibuat sebagai backend REST API untuk kebutuhan assessment dan demonstrasi implementasi marketplace otomotif.

Fokus utama project:

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
