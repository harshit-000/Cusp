import { config as fileConfig } from "~config";
import { configSchema, type ResolvedConfig, type Weights } from "./schema";
import { DEFAULT_WEIGHTS } from "./defaults";

/**
 * The raw config source. In deployment the local jobscout.config.ts is absent
 * (git-ignored), so the config is supplied as JSON via the JOBSCOUT_CONFIG env
 * var. Locally we fall back to the file. Env wins when both are present.
 */
function rawConfig(): unknown {
  const fromEnv = process.env.JOBSCOUT_CONFIG;
  if (fromEnv && fromEnv.trim()) {
    try {
      return JSON.parse(fromEnv);
    } catch (err) {
      throw new Error(
        `JOBSCOUT_CONFIG is set but is not valid JSON: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
  return fileConfig;
}

/** Config after parsing + defaults, with weights fully resolved (no undefined). */
export type AppConfig = Omit<ResolvedConfig, "weights"> & {
  weights: Required<Weights>;
};

/** Placeholder name in the example template; means the user hasn't configured yet. */
const PLACEHOLDER_NAME = "your name";

/** Thrown when jobscout.config.ts is still the untouched template. */
export class ConfigNotSetError extends Error {
  constructor() {
    super("Cusp is not configured yet.");
    this.name = "ConfigNotSetError";
  }
}

let cached: AppConfig | null = null;

/**
 * Load, validate, and resolve the user's jobscout.config.ts.
 *
 * Throws `ConfigNotSetError` if the config is still the template (name unchanged),
 * or a plain-English error if the config is invalid. The result is cached.
 */
export function loadConfig(): AppConfig {
  if (cached) return cached;

  const parsed = configSchema.safeParse(rawConfig());
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  • ${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("\n");
    throw new Error(
      `\n❌ Your jobscout.config.ts has problems:\n${issues}\n\n` +
        `Fix the fields above and restart. See README → "Make it yours".\n`,
    );
  }

  if (parsed.data.profile.name.trim().toLowerCase() === PLACEHOLDER_NAME) {
    throw new ConfigNotSetError();
  }

  cached = {
    ...parsed.data,
    weights: { ...DEFAULT_WEIGHTS, ...(parsed.data.weights ?? {}) },
  };
  return cached;
}

export type ConfigState =
  | { status: "ok"; config: AppConfig }
  | { status: "not-set" }
  | { status: "invalid"; message: string };

/** Non-throwing config check — for pages/APIs to branch on. */
export function configState(): ConfigState {
  try {
    return { status: "ok", config: loadConfig() };
  } catch (err) {
    if (err instanceof ConfigNotSetError) return { status: "not-set" };
    return { status: "invalid", message: err instanceof Error ? err.message : String(err) };
  }
}
