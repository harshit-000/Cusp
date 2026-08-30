import { configState } from "@/config/load";
import { Board } from "@/components/Board";

export default function Home() {
  const state = configState();
  if (state.status !== "ok") return null; // layout renders the setup screen

  const { profile } = state.config;
  const firstName = profile.name.split(" ")[0];

  return (
    <>
      <header className="mb-6">
        <h1 className="font-serif text-3xl font-medium tracking-tight md:text-4xl">
          Good morning, {firstName}.
        </h1>
        <p className="mt-2 text-muted-foreground">
          Roles ranked by fit to your résumé · ₹{profile.salaryMinLpa}–{profile.salaryMaxLpa} LPA ·{" "}
          {profile.basedIn}
        </p>
      </header>
      <Board />
    </>
  );
}
