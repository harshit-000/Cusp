import type { Connector, ConnectorResult } from "./index";
import { companyId } from "./index";
import { httpJson, stripHtml, cleanLocation } from "@/lib/http";
import type { NormalizedJob } from "@/lib/types";

interface AshbyJob {
  id?: string;
  jobId?: string;
  title: string;
  location?: string;
  isRemote?: boolean;
  jobUrl?: string;
  applyUrl?: string;
  publishedAt?: string;
  descriptionPlain?: string;
  descriptionHtml?: string;
  compensation?: { compensationTierSummary?: string };
}
interface AshbyResponse {
  jobs: AshbyJob[];
}

export const ashby: Connector = {
  ats: "ashby",
  async fetchBoard(company, etag): Promise<ConnectorResult> {
    const url = `https://api.ashbyhq.com/posting-api/job-board/${company.token}?includeCompensation=true`;
    const res = await httpJson<AshbyResponse>(url, etag);
    if (res.notModified) return { jobs: [], etag: res.etag, notModified: true };

    const jobs = (res.data?.jobs ?? []).map<NormalizedJob>((j) => {
      const loc = cleanLocation(j.location);
      return {
        externalId: String(j.id ?? j.jobId ?? j.jobUrl ?? j.title),
        ats: "ashby",
        companyId: companyId("ashby", company.token),
        company: company.name,
        token: company.token,
        title: j.title,
        location: loc,
        remote: Boolean(j.isRemote) || /remote/i.test(loc ?? ""),
        url: j.jobUrl ?? j.applyUrl ?? "",
        description: j.descriptionPlain ?? stripHtml(j.descriptionHtml),
        compensationText: j.compensation?.compensationTierSummary,
        postedAt: j.publishedAt ? new Date(j.publishedAt) : null,
      };
    });
    return { jobs, etag: res.etag, notModified: false };
  },
};
