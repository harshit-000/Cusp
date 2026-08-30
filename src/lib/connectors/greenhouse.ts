import type { Connector, ConnectorResult } from "./index";
import { companyId } from "./index";
import { httpJson, stripHtml, cleanLocation } from "@/lib/http";
import type { NormalizedJob } from "@/lib/types";

interface GhJob {
  id: number;
  title: string;
  absolute_url: string;
  updated_at?: string;
  location?: { name?: string };
  content?: string; // HTML, present with ?content=true
}
interface GhResponse {
  jobs: GhJob[];
}

export const greenhouse: Connector = {
  ats: "greenhouse",
  async fetchBoard(company, etag): Promise<ConnectorResult> {
    const url = `https://boards-api.greenhouse.io/v1/boards/${company.token}/jobs?content=true`;
    const res = await httpJson<GhResponse>(url, etag);
    if (res.notModified) return { jobs: [], etag: res.etag, notModified: true };

    const jobs = (res.data?.jobs ?? []).map<NormalizedJob>((j) => {
      const loc = cleanLocation(j.location?.name);
      return {
        externalId: String(j.id),
        ats: "greenhouse",
        companyId: companyId("greenhouse", company.token),
        company: company.name,
        token: company.token,
        title: j.title,
        location: loc,
        remote: /remote/i.test(loc ?? ""),
        url: j.absolute_url,
        description: stripHtml(j.content),
        postedAt: j.updated_at ? new Date(j.updated_at) : null,
      };
    });
    return { jobs, etag: res.etag, notModified: false };
  },
};
