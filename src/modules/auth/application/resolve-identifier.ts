const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^\+?[1-9]\d{7,14}$/;

export function resolveLoginIdentifier(input: string) {
  if (emailPattern.test(input)) return { kind: "email" as const, value: input };
  if (phonePattern.test(input)) return { kind: "phone" as const, value: input };
  return { kind: "username" as const, value: input };
}
