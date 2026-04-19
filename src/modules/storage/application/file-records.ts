import { db } from "@/infrastructure/db/client";
import { files } from "../persistence/schema";

export async function recordFileMetadata(input: {
  tenantId?: string;
  uploaderUserId?: string;
  provider: "r2" | "oss";
  bucket: string;
  objectKey: string;
  mimeType: string;
  size: number;
}) {
  const [file] = await db
    .insert(files)
    .values({
      tenantId: input.tenantId ?? null,
      uploaderUserId: input.uploaderUserId ?? null,
      provider: input.provider,
      bucket: input.bucket,
      objectKey: input.objectKey,
      mimeType: input.mimeType,
      size: input.size,
      visibility: "private",
    })
    .returning({ id: files.id });

  return file;
}
