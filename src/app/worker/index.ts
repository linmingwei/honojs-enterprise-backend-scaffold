import { appModules } from "@/app/bootstrap/app-modules";
import { getEnabledModules } from "@/app/bootstrap/module-registry";
import { loadConfig } from "@/shared/config/load-config";

export function startWorker() {
  const config = loadConfig();

  return getEnabledModules(config, appModules)
    .map((module) => module.registerWorker?.(config))
    .filter((worker) => worker !== undefined);
}

if (import.meta.main) {
  startWorker();
}
