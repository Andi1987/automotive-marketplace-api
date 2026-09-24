import type { Request, Response } from "express";

import {
  createNewUser,
  getUserById,
  listUsers,
  removeUser,
  updateExistingUser,
} from "../services/user.service";

import {
  createUserSchema,
  updateUserSchema,
} from "../validators/user.validator";

function getUserId(req: Request): string | null {
  const { id } = req.params;

  if (typeof id !== "string") {
    return null;
  }

  return id;
}

function sanitizeUser(user: {
  id: string;
  full_name: string;
  email: string;
  role: "buyer" | "seller" | "admin";
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}) {
  return {
    id: user.id,
    full_name: user.full_name,
    email: user.email,
    role: user.role,
    is_active: user.is_active,
    created_at: user.created_at,
    updated_at: user.updated_at,
  };
}

export async function getUsers(
  _req: Request,
  res: Response,
): Promise<void> {
  const users = await listUsers();

  res.status(200).json({
    status: true,
    message: "Users retrieved successfully",
    data: users.map(sanitizeUser),
  });
}

export async function getUser(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = getUserId(req);

  if (!userId) {
    res.status(400).json({
      status: false,
      message: "Invalid user ID",
      data: null,
    });

    return;
  }

  const user = await getUserById(userId);

  if (!user) {
    res.status(404).json({
      status: false,
      message: "User not found",
      data: null,
    });

    return;
  }

  res.status(200).json({
    status: true,
    message: "User retrieved successfully",
    data: sanitizeUser(user),
  });
}

export async function createUser(
  req: Request,
  res: Response,
): Promise<void> {
  const parsed = createUserSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(422).json({
      status: false,
      message: "Validation failed",
      data: parsed.error.flatten(),
    });

    return;
  }

  try {
    const user = await createNewUser({
      full_name: parsed.data.full_name,
      email: parsed.data.email,
      password: parsed.data.password,
      role: parsed.data.role,
    });

    res.status(201).json({
      status: true,
      message: "User created successfully",
      data: sanitizeUser(user),
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Email already registered"
    ) {
      res.status(409).json({
        status: false,
        message: error.message,
        data: null,
      });

      return;
    }

    throw error;
  }
}

export async function updateUser(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = getUserId(req);

  if (!userId) {
    res.status(400).json({
      status: false,
      message: "Invalid user ID",
      data: null,
    });

    return;
  }

  const parsed = updateUserSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(422).json({
      status: false,
      message: "Validation failed",
      data: parsed.error.flatten(),
    });

    return;
  }

  const user = await updateExistingUser(
    userId,
    parsed.data,
  );

  if (!user) {
    res.status(404).json({
      status: false,
      message: "User not found",
      data: null,
    });

    return;
  }

  res.status(200).json({
    status: true,
    message: "User updated successfully",
    data: sanitizeUser(user),
  });
}

export async function deleteUser(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = getUserId(req);

  if (!userId) {
    res.status(400).json({
      status: false,
      message: "Invalid user ID",
      data: null,
    });

    return;
  }

  const deleted = await removeUser(userId);

  if (!deleted) {
    res.status(404).json({
      status: false,
      message: "User not found",
      data: null,
    });

    return;
  }

  res.status(200).json({
    status: true,
    message: "User deleted successfully",
    data: null,
  });
}