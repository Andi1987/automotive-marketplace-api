import fs from "node:fs";
import path from "node:path";
import YAML from "yamljs";

const openApiPath = path.resolve(
  process.cwd(),
  "docs",
  "openapi.yaml",
);

if (!fs.existsSync(openApiPath)) {
  throw new Error(`OpenAPI specification not found: ${openApiPath}`);
}

export const swaggerDocument = YAML.load(openApiPath);