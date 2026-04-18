import { describe, expect, it } from "bun:test";
import { resolveLoginIdentifier } from "@/modules/auth/application/resolve-identifier";

describe("resolveLoginIdentifier", () => {
  it("distinguishes email, phone, and username", () => {
    expect(resolveLoginIdentifier("a@example.com")).toEqual({
      kind: "email",
      value: "a@example.com",
    });
    expect(resolveLoginIdentifier("+8613800138000")).toEqual({
      kind: "phone",
      value: "+8613800138000",
    });
    expect(resolveLoginIdentifier("eric-admin")).toEqual({
      kind: "username",
      value: "eric-admin",
    });
  });
});
