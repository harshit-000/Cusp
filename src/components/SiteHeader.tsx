import Link from "next/link";
import { Nav } from "./Nav";
import { LogoutButton } from "./LogoutButton";
import { FetchToggle } from "./FetchToggle";
import { authEnabled } from "@/lib/auth";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="container flex max-w-[920px] items-center justify-between gap-3 py-3">
        <Link href="/" className="font-serif text-lg font-semibold">
          Cusp<span className="text-primary">.</span>
        </Link>
        <div className="flex items-center gap-3">
          <FetchToggle />
          <Nav />
          {authEnabled() && <LogoutButton />}
        </div>
      </div>
    </header>
  );
}
