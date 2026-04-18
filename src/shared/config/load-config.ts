import { readFileSync } from "node:fs";
import { parse as parseToml } from "smol-toml";
import { appConfigSchema, type AppConfig } from "./types";

export function loadConfig(path = "config/app.toml"): AppConfig {
  const raw = readFileSync(path, "utf-8");
  return appConfigSchema.parse(parseToml(raw));
}
