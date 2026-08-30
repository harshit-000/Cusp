import type { ConfigState } from "@/config/load";

/** Shown when jobscout.config.ts is missing/unconfigured or invalid. No data is
 *  fetched in this state — the app waits for a valid config. */
export function SetupScreen({ state }: { state: Exclude<ConfigState, { status: "ok" }> }) {
  const invalid = state.status === "invalid";

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-6 py-16">
      <p className="text-xs font-semibold uppercase tracking-widest text-primary">Cusp</p>
      <h1 className="mt-2 font-serif text-3xl font-medium tracking-tight md:text-4xl">
        {invalid ? "Your config needs a fix" : "Let's set up your config"}
      </h1>
      <p className="mt-3 text-muted-foreground">
        {invalid
          ? "Cusp loaded your config but found a problem. Fix it and restart — nothing is fetched until it's valid."
          : "Cusp is config-driven — one file describes you and what you want. Create it to get started; nothing is fetched until it's set."}
      </p>

      {invalid ? (
        <pre className="mt-6 overflow-x-auto rounded-lg border bg-card p-4 text-sm text-destructive">
          {state.message.trim()}
        </pre>
      ) : (
        <ol className="mt-8 space-y-5">
          <li className="flex gap-3">
            <Step n={1} />
            <div>
              <p className="font-medium">Copy the template</p>
              <pre className="mt-1.5 overflow-x-auto rounded-md border bg-card px-3 py-2 text-sm">
                cp jobscout.config.example.ts jobscout.config.ts
              </pre>
            </div>
          </li>
          <li className="flex gap-3">
            <Step n={2} />
            <div>
              <p className="font-medium">
                Open <code className="rounded bg-muted px-1 py-0.5 text-sm">jobscout.config.ts</code>{" "}
                and make it yours
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Change <code className="rounded bg-muted px-1 py-0.5 text-xs">profile.name</code>{" "}
                from <code className="rounded bg-muted px-1 py-0.5 text-xs">&quot;Your Name&quot;</code>{" "}
                to your real name, then set your skills, salary, locations, and the
                companies to watch.
              </p>
            </div>
          </li>
          <li className="flex gap-3">
            <Step n={3} />
            <div>
              <p className="font-medium">Add your secrets (optional but recommended)</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Copy <code className="rounded bg-muted px-1 py-0.5 text-xs">.env.example</code> to{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">.env</code> and set{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">DATABASE_URL</code> (to save
                jobs) and <code className="rounded bg-muted px-1 py-0.5 text-xs">ADZUNA_*</code> keys
                (for market-wide search).
              </p>
            </div>
          </li>
          <li className="flex gap-3">
            <Step n={4} />
            <div>
              <p className="font-medium">Restart</p>
              <pre className="mt-1.5 overflow-x-auto rounded-md border bg-card px-3 py-2 text-sm">
                npm run dev
              </pre>
            </div>
          </li>
        </ol>
      )}

      <p className="mt-10 text-sm text-muted-foreground">
        Full guide in <code className="rounded bg-muted px-1 py-0.5 text-xs">README.md</code> and{" "}
        <code className="rounded bg-muted px-1 py-0.5 text-xs">ABOUT.md</code>.
      </p>
    </main>
  );
}

function Step({ n }: { n: number }) {
  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
      {n}
    </span>
  );
}
