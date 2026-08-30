/**
 * Probe live ATS boards WITHOUT a database. Fetches each configured company,
 * runs the full gate→eligibility→score pipeline, and prints the top matches.
 *
 *   npm run probe            # all companies
 *   npm run probe stripe     # only companies whose name matches "stripe"
 */
import { loadConfig } from "@/config/load";
import { getConnector } from "@/lib/connectors";
import { evaluateBoard } from "@/lib/engine/pipeline";

async function main() {
  const cfg = loadConfig();
  const filter = process.argv[2]?.toLowerCase();
  const targets = filter
    ? cfg.companies.filter((c) => c.name.toLowerCase().includes(filter))
    : cfg.companies;

  for (const company of targets) {
    try {
      const { jobs } = await getConnector(company.ats).fetchBoard(company);
      const evaluation = evaluateBoard(cfg, company, jobs);
      console.log(
        `\n=== ${company.name} (${company.ats}) — ${jobs.length} raw · ` +
          `${evaluation.kept.length} kept · dropped ${evaluation.droppedExcluded} excluded / ${evaluation.droppedRole} role ===`,
      );
      for (const ev of evaluation.kept.slice(0, 8)) {
        const sal = ev.salary?.raw ? ` · 💰 ${ev.salary.raw}` : "";
        console.log(
          `  [${String(ev.score).padStart(3)}] ${ev.eligibility.padEnd(8)} ${ev.job.title}` +
            `  (${ev.job.location ?? "?"})${sal}`,
        );
        console.log(`        ${ev.reason}`);
      }
    } catch (err) {
      console.log(`\n=== ${company.name} — ERROR: ${err instanceof Error ? err.message : err}`);
    }
  }
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  },
);
