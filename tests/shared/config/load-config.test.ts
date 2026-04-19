import { afterEach, describe, expect, it } from "bun:test";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { loadConfig } from "@/shared/config/load-config";

const fixtureDir = join(process.cwd(), "tmp", "config-tests");
const fixturePath = join(fixtureDir, "app.toml");

describe("loadConfig", () => {
  afterEach(() => {
    delete process.env.R2_BUCKET;
    delete process.env.R2_ENDPOINT;
    rmSync(fixtureDir, { force: true, recursive: true });
  });

  it("overlays env-backed storage secrets on top of TOML config", () => {
    mkdirSync(fixtureDir, { recursive: true });
    writeFileSync(
      fixturePath,
      `
[features.auth]
enabled = true

[features.tenant]
enabled = true

[features.rbac]
enabled = true

[features.audit]
enabled = true

[features.storage]
enabled = true

[features.cache]
enabled = false

[features.queue]
enabled = false

[features.scheduler]
enabled = false

[features.payment]
enabled = false

[features.notify]
enabled = false

[providers]
storage = "r2"
cache = "redis"
queue = "none"

[auth]
baseUrl = "http://localhost:3000"

[storage.r2]
bucket = ""
endpoint = ""

[storage.oss]
region = ""
bucket = ""

[db]
url = "postgres://example"

[redis]
url = ""
`,
    );

    process.env.R2_BUCKET = "env-bucket";
    process.env.R2_ENDPOINT = "https://r2.example.com";

    const config = loadConfig(fixturePath);

    expect(config.storage.r2.bucket).toBe("env-bucket");
    expect(config.storage.r2.endpoint).toBe("https://r2.example.com");
  });
});
