import type { OpenAPIHono } from "@hono/zod-openapi";
import { auth } from "@/infrastructure/auth/better-auth";
import { AppError } from "@/shared/errors/app-error";
import { z } from "zod";
import { resolveLoginIdentifier } from "../application/resolve-identifier";

const unifiedLoginSchema = z.object({
  identifier: z.string().min(1),
  password: z.string().optional(),
  otp: z.string().optional(),
  rememberMe: z.boolean().optional(),
});

const requestOtpSchema = z.object({
  identifier: z.string().min(1),
});

function createAuthProxyRequest(
  request: Request,
  pathname: string,
  body: Record<string, unknown>,
) {
  const url = new URL(request.url);
  url.pathname = pathname;
  const headers = new Headers(request.headers);
  headers.set("content-type", "application/json");

  return new Request(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

function resolvePasswordEndpoint(identifier: ReturnType<typeof resolveLoginIdentifier>) {
  switch (identifier.kind) {
    case "email":
      return {
        pathname: "/api/auth/sign-in/email",
        key: "email",
      } as const;
    case "phone":
      return {
        pathname: "/api/auth/sign-in/phone-number",
        key: "phoneNumber",
      } as const;
    case "username":
      return {
        pathname: "/api/auth/sign-in/username",
        key: "username",
      } as const;
  }
}

function resolveOtpEndpoint(identifier: ReturnType<typeof resolveLoginIdentifier>) {
  switch (identifier.kind) {
    case "email":
      return {
        pathname: "/api/auth/sign-in/email-otp",
        key: "email",
        otpKey: "otp",
      } as const;
    case "phone":
      return {
        pathname: "/api/auth/phone-number/verify",
        key: "phoneNumber",
        otpKey: "code",
      } as const;
    case "username":
      throw new AppError("Username does not support OTP login", 400, "invalid_otp_login");
  }
}

export function registerAuthRoutes(app: OpenAPIHono) {
  app.post("/api/auth/unified-login", async (c) => {
    const body = unifiedLoginSchema.parse(await c.req.json());
    const resolved = resolveLoginIdentifier(body.identifier);

    if (!body.password && !body.otp) {
      throw new AppError(
        "Either password or otp is required",
        400,
        "missing_auth_factor",
      );
    }

    if (body.password) {
      const endpoint = resolvePasswordEndpoint(resolved);
      const response = await auth.handler(
        createAuthProxyRequest(c.req.raw, endpoint.pathname, {
          [endpoint.key]: resolved.value,
          password: body.password,
          rememberMe: body.rememberMe,
        }),
      );
      return response;
    }

    const endpoint = resolveOtpEndpoint(resolved);
    const response = await auth.handler(
      createAuthProxyRequest(c.req.raw, endpoint.pathname, {
        [endpoint.key]: resolved.value,
        [endpoint.otpKey]: body.otp,
      }),
    );
    return response;
  });

  app.post("/api/auth/request-otp", async (c) => {
    const body = requestOtpSchema.parse(await c.req.json());
    const resolved = resolveLoginIdentifier(body.identifier);

    const response =
      resolved.kind === "email"
        ? await auth.handler(
            createAuthProxyRequest(c.req.raw, "/api/auth/email-otp/send-verification-otp", {
              email: resolved.value,
              type: "sign-in",
            }),
          )
        : await auth.handler(
            createAuthProxyRequest(c.req.raw, "/api/auth/phone-number/send-otp", {
              phoneNumber: resolved.value,
            }),
          );

    return response;
  });

  app.all("/api/auth/*", (c) => auth.handler(c.req.raw));
}
