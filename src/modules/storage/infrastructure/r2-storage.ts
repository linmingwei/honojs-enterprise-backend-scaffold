import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export type R2StorageConfig = {
  bucket?: string;
  endpoint?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
};

export function createR2Storage(config: R2StorageConfig = {}) {
  const bucket = config.bucket ?? process.env.R2_BUCKET ?? "dev-bucket";
  const client = new S3Client({
    region: "auto",
    endpoint: config.endpoint ?? process.env.R2_ENDPOINT ?? "http://127.0.0.1:9000",
    forcePathStyle: true,
    credentials: {
      accessKeyId: config.accessKeyId ?? process.env.R2_ACCESS_KEY_ID ?? "dev-access-key",
      secretAccessKey:
        config.secretAccessKey ?? process.env.R2_SECRET_ACCESS_KEY ?? "dev-secret-key",
    },
  });

  return {
    providerName: "r2" as const,
    put: async (input: {
      key: string;
      body: ArrayBuffer;
      contentType: string;
    }) => {
      await client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: input.key,
          Body: new Uint8Array(input.body),
          ContentType: input.contentType,
        }),
      );
    },
    signUpload: async (input: { key: string; contentType: string }) => ({
      url: await getSignedUrl(
        client,
        new PutObjectCommand({
          Bucket: bucket,
          Key: input.key,
          ContentType: input.contentType,
        }),
        { expiresIn: 300 },
      ),
    }),
  };
}
