import { createApp } from "./create-app";
import { loadConfig } from "@/shared/config/load-config";

const app = createApp(loadConfig());

export function startServer(port = Number(process.env.PORT ?? 3000)) {
  return Bun.serve({
    port,
    fetch: app.fetch,
  });
}

if (import.meta.main) {
  startServer();
}
