import type { AppModule } from "@/modules/core/module";
import type { AppConfig } from "@/shared/config/types";

export type ModuleName = keyof AppConfig["features"];

export type ModuleRegistrarMap = Partial<Record<ModuleName, () => void>>;

export function registerModules(config: AppConfig, registrars: ModuleRegistrarMap) {
  for (const [name, feature] of Object.entries(config.features)) {
    if (!feature.enabled) continue;
    registrars[name as ModuleName]?.();
  }
}

export function getEnabledModules(config: AppConfig, modules: AppModule[]) {
  return modules.filter((module) => module.kind === "core" || config.features[module.name].enabled);
}
