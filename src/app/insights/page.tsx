import { Insights } from "@/components/Insights";

export default function InsightsPage() {
  return (
    <>
      <header className="mb-6">
        <h1 className="font-serif text-3xl font-medium tracking-tight md:text-4xl">Insights</h1>
        <p className="mt-2 text-muted-foreground">
          Which applications actually get replies — your funnel, by tier and eligibility.
        </p>
      </header>
      <Insights />
    </>
  );
}
