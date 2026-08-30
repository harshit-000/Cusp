import type { Connector, ConnectorResult } from "./index";
import { companyId } from "./index";
import { httpJson, stripHtml, cleanLocation } from "@/lib/http";
import type { NormalizedJob } from "@/lib/types";

interface LeverJob {
  id: string;
  text: string; // title
  hostedUrl: string;
  createdAt?: number; // epoch ms
  categories?: { location?: string; team?: string; commitment?: string };
  descriptionPlain?: string;
  description?: string;
  workplaceType?: string;
}

export const lever: Connector = {
  ats: "lever",
  async fetchBoard(company, etag): Promise<ConnectorResult> {
    const url = `https://api.lever.co/v0/postings/${company.token}?mode=json`;
    const res = await httpJson<LeverJob[]>(url, etag);
    if (res.notModified) return { jobs: [], etag: res.etag, notModified: true };

    const jobs = (res.data ?? []).map<NormalizedJob>((j) => {
      const loc = cleanLocation(j.categories?.location);
      return {
        externalId: j.id,
        ats: "lever",
        companyId: companyId("lever", company.token),
        company: company.name,
        token: company.token,
        title: j.text,
        location: loc,
        remote:
          (j.workplaceType ?? "").toLowerCase() === "remote" ||
          /remote/i.test(loc ?? ""),
        url: j.hostedUrl,
        description: j.descriptionPlain ?? stripHtml(j.description),
        postedAt: j.createdAt ? new Date(j.createdAt) : null,
      };
    });
    return { jobs, etag: res.etag, notModified: false };
  },
};
