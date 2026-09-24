import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";

import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);

const KEY_LENGTH = 64;
const SALT_LENGTH = 16;

export async function hashPassword(
  password: string,
): Promise<string> {
  const salt = randomBytes(SALT_LENGTH);

  const derivedKey = (await scrypt(
    password,
    salt,
    KEY_LENGTH,
  )) as Buffer;

  return [
    "scrypt",
    salt.toString("hex"),
    derivedKey.toString("hex"),
  ].join("$");
}

export async function verifyPassword(
  password: string,
  storedHash: string,
): Promise<boolean> {
  const [algorithm, saltHex, hashHex] = storedHash.split("$");

  if (
    algorithm !== "scrypt" ||
    !saltHex ||
    !hashHex
  ) {
    return false;
  }

  const salt = Buffer.from(saltHex, "hex");
  const storedKey = Buffer.from(hashHex, "hex");

  const derivedKey = (await scrypt(
    password,
    salt,
    storedKey.length,
  )) as Buffer;

  return timingSafeEqual(
    storedKey,
    derivedKey,
  );
}