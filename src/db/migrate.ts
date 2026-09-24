import fs from "node:fs/promises";
import path from "node:path";

import { pool } from "../config/database";

const migrationsDirectory = path.resolve(
  process.cwd(),
  "database",
  "migrations",
);

interface Migration {
  version: string;
  filename: string;
  sql: string;
}

async function loadMigrations(): Promise<Migration[]> {
  const files = await fs.readdir(migrationsDirectory);

  const migrationFiles = files
    .filter((file) => file.endsWith(".sql"))
    .sort();

  const migrations: Migration[] = [];

  for (const filename of migrationFiles) {
    const version = filename.replace(".sql", "");

    const sql = await fs.readFile(
      path.join(migrationsDirectory, filename),
      "utf8",
    );

    migrations.push({
      version,
      filename,
      sql,
    });
  }

  return migrations;
}

async function ensureMigrationTable(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

async function getAppliedMigrations(): Promise<Set<string>> {
  const result = await pool.query<{ version: string }>(
    "SELECT version FROM schema_migrations ORDER BY version",
  );

  return new Set(result.rows.map((row) => row.version));
}

async function runMigration(migration: Migration): Promise<void> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query(migration.sql);

    await client.query(
      `
        INSERT INTO schema_migrations (version)
        VALUES ($1)
      `,
      [migration.version],
    );

    await client.query("COMMIT");

    console.log(`✓ Applied migration: ${migration.filename}`);
  } catch (error) {
    await client.query("ROLLBACK");

    console.error(`✗ Failed migration: ${migration.filename}`);

    throw error;
  } finally {
    client.release();
  }
}

async function migrate(): Promise<void> {
  try {
    console.log("Starting database migrations...");

    await ensureMigrationTable();

    const migrations = await loadMigrations();
    const appliedMigrations = await getAppliedMigrations();

    let pendingCount = 0;

    for (const migration of migrations) {
      if (appliedMigrations.has(migration.version)) {
        continue;
      }

      await runMigration(migration);
      pendingCount++;
    }

    if (pendingCount === 0) {
      console.log("Database is already up to date.");
    } else {
      console.log(
        `Database migration completed. Applied ${pendingCount} migration(s).`,
      );
    }
  } finally {
    await pool.end();
  }
}

void migrate().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});