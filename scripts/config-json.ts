/**
 * Print your local jobscout.config.ts as one line of JSON, to paste into the
 * JOBSCOUT_CONFIG environment variable on Vercel:  npm run config:json
 */
import { config } from "~config";

console.log(JSON.stringify(config));
