import OSS from "ali-oss";

export type OssStorageConfig = {
  region?: string;
  bucket?: string;
  accessKeyId?: string;
  accessKeySecret?: string;
};

export function createOssStorage(config: OssStorageConfig = {}) {
  const client = new OSS({
    region: config.region ?? process.env.OSS_REGION ?? "oss-cn-hangzhou",
    bucket: config.bucket ?? process.env.OSS_BUCKET ?? "dev-bucket",
    accessKeyId: config.accessKeyId ?? process.env.OSS_ACCESS_KEY_ID ?? "dev-access-key",
    accessKeySecret:
      config.accessKeySecret ?? process.env.OSS_ACCESS_KEY_SECRET ?? "dev-secret-key",
  });

  return {
    providerName: "oss" as const,
    put: async (input: {
      key: string;
      body: ArrayBuffer;
      contentType: string;
    }) => {
      await client.put(input.key, Buffer.from(input.body), {
        headers: {
          "Content-Type": input.contentType,
        },
      });
    },
    get: async (key: string) => client.get(key),
    delete: async (key: string) => {
      await client.delete(key);
    },
    signUpload: async (input: { key: string; contentType: string }) => ({
      url: client.signatureUrl(input.key, {
        method: "PUT",
        "Content-Type": input.contentType,
      }),
    }),
    signDownload: async (key: string) => ({
      url: client.signatureUrl(key, {
        method: "GET",
      }),
    }),
  };
}
