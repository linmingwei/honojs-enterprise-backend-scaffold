import { describe, expect, it } from "bun:test";
import { createObjectStorage } from "@/modules/storage/domain/object-storage";

describe("object storage provider selection", () => {
  it("creates an R2 adapter when provider=r2", () => {
    const storage = createObjectStorage({ provider: "r2" });
    expect(storage.providerName).toBe("r2");
  });
});
