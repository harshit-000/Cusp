import { Tracker } from "@/components/Tracker";

export default function TrackerPage() {
  return (
    <>
      <header className="mb-6">
        <h1 className="font-serif text-3xl font-medium tracking-tight md:text-4xl">Tracker</h1>
        <p className="mt-2 text-muted-foreground">
          Your application pipeline. Applications silent for 21 days auto-mark as ghosted.
        </p>
      </header>
      <Tracker />
    </>
  );
}
