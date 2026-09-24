import { pool } from "../config/database";

export interface User {
  id: string;
  full_name: string;
  email: string;
  password_hash: string;
  role: "buyer" | "seller" | "admin";
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserInput {
  full_name: string;
  email: string;
  password_hash: string;
  role?: "buyer" | "seller" | "admin";
}

export interface UpdateUserInput {
  full_name?: string;
  email?: string;
  role?: "buyer" | "seller" | "admin";
  is_active?: boolean;
}

export async function findAllUsers(): Promise<User[]> {
  const result = await pool.query<User>(
    `
      SELECT
        id,
        full_name,
        email,
        password_hash,
        role,
        is_active,
        created_at,
        updated_at
      FROM users
      ORDER BY created_at DESC
    `,
  );

  return result.rows;
}

export async function findUserById(
  id: string,
): Promise<User | null> {
  const result = await pool.query<User>(
    `
      SELECT
        id,
        full_name,
        email,
        password_hash,
        role,
        is_active,
        created_at,
        updated_at
      FROM users
      WHERE id = $1
      LIMIT 1
    `,
    [id],
  );

  return result.rows[0] ?? null;
}

export async function findUserByEmail(
  email: string,
): Promise<User | null> {
  const result = await pool.query<User>(
    `
      SELECT
        id,
        full_name,
        email,
        password_hash,
        role,
        is_active,
        created_at,
        updated_at
      FROM users
      WHERE email = $1
      LIMIT 1
    `,
    [email],
  );

  return result.rows[0] ?? null;
}

export async function createUser(
  input: CreateUserInput,
): Promise<User> {
  const result = await pool.query<User>(
    `
      INSERT INTO users (
        full_name,
        email,
        password_hash,
        role
      )
      VALUES ($1, $2, $3, $4)
      RETURNING
        id,
        full_name,
        email,
        password_hash,
        role,
        is_active,
        created_at,
        updated_at
    `,
    [
      input.full_name,
      input.email,
      input.password_hash,
      input.role ?? "buyer",
    ],
  );

  return result.rows[0];
}

export async function updateUser(
  id: string,
  input: UpdateUserInput,
): Promise<User | null> {
  const result = await pool.query<User>(
    `
      UPDATE users
      SET
        full_name = COALESCE($2, full_name),
        email = COALESCE($3, email),
        role = COALESCE($4, role),
        is_active = COALESCE($5, is_active),
        updated_at = NOW()
      WHERE id = $1
      RETURNING
        id,
        full_name,
        email,
        password_hash,
        role,
        is_active,
        created_at,
        updated_at
    `,
    [
      id,
      input.full_name ?? null,
      input.email ?? null,
      input.role ?? null,
      input.is_active ?? null,
    ],
  );

  return result.rows[0] ?? null;
}

export async function deleteUser(
  id: string,
): Promise<boolean> {
  const result = await pool.query(
    `
      DELETE FROM users
      WHERE id = $1
    `,
    [id],
  );

  return result.rowCount === 1;
}