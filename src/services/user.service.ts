import {
  createUser,
  deleteUser,
  findAllUsers,
  findUserByEmail,
  findUserById,
  updateUser,
} from "../repositories/user.repository";

import { hashPassword } from "./password.service";

import type {
  CreateUserInput,
  UpdateUserInput,
} from "../repositories/user.repository";

export interface CreateUserServiceInput {
  full_name: string;
  email: string;
  password: string;
  role?: "buyer" | "seller" | "admin";
}

export async function listUsers() {
  return findAllUsers();
}

export async function getUserById(id: string) {
  return findUserById(id);
}

export async function createNewUser(
  input: CreateUserServiceInput,
) {
  const existingUser = await findUserByEmail(input.email);

  if (existingUser) {
    throw new Error("Email already registered");
  }

  const passwordHash = await hashPassword(
    input.password,
  );

  const repositoryInput: CreateUserInput = {
    full_name: input.full_name,
    email: input.email,
    password_hash: passwordHash,
    role: input.role,
  };

  return createUser(repositoryInput);
}

export async function updateExistingUser(
  id: string,
  input: UpdateUserInput,
) {
  return updateUser(id, input);
}

export async function removeUser(
  id: string,
) {
  return deleteUser(id);
}