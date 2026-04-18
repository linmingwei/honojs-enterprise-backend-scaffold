import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, emailOTP, phoneNumber, username } from "better-auth/plugins";
import { db } from "@/infrastructure/db/client";

const tempEmailForPhone = (phoneNumberValue: string) =>
  `phone-${phoneNumberValue.replace(/\D/g, "")}@placeholder.local`;

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  secret:
    process.env.BETTER_AUTH_SECRET ??
    "development-only-better-auth-secret-please-change-me",
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    username(),
    phoneNumber({
      sendOTP: async ({ phoneNumber: targetPhoneNumber, code }) => {
        console.info("send phone otp", { phoneNumber: targetPhoneNumber, code });
      },
      signUpOnVerification: {
        getTempEmail: tempEmailForPhone,
        getTempName: (phoneNumberValue) => phoneNumberValue,
      },
    }),
    emailOTP({
      sendVerificationOTP: async ({ email, otp, type }) => {
        console.info("send email otp", { email, otp, type });
      },
    }),
    admin(),
  ],
});
