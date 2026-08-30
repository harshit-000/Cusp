import type { Ats, CompanyConfig } from "@/config/schema";
import type { NormalizedJob } from "@/lib/types";
import { greenhouse } from "./greenhouse";
import { lever } from "./lever";
import { ashby } from "./ashby";

export interface ConnectorResult {
  jobs: NormalizedJob[];
  etag?: string;
  notModified: boolean;
}

export interface Connector {
  ats: Ats;
  fetchBoard(company: CompanyConfig, etag?: string): Promise<ConnectorResult>;
}

/** Phase 1 connectors. SmartRecruiters + Rippling land in Phase 4. */
const registry: Partial<Record<Ats, Connector>> = {
  greenhouse,
  lever,
  ashby,
};

export function getConnector(ats: Ats): Connector {
  const c = registry[ats];
  if (!c) {
    throw new Error(
      `No connector for ATS "${ats}". Phase 1 supports: greenhouse, lever, ashby.`,
    );
  }
  return c;
}

export function companyId(ats: Ats, token: string): string {
  return `${ats}:${token}`;
}
