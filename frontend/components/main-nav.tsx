"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";

const NAV_ITEMS = [
  { href: "/", label: "Pointage du jour" },
  { href: "/history", label: "Historique" },
  { href: "/summary", label: "Bilan" },
] as const;

// The menu of the application. The current page is announced with aria-current and highlighted.
// usePathname depends on the request, so it lives under a <Suspense> whose fallback is the same menu.
export function MainNav() {
  return (
    <Suspense fallback={<NavLinks currentPath={null} />}>
      <CurrentNav />
    </Suspense>
  );
}

function CurrentNav() {
  return <NavLinks currentPath={usePathname()} />;
}

function NavLinks({ currentPath }: { currentPath: string | null }) {
  return (
    <nav aria-label="Navigation principale">
      <ul className="flex flex-wrap gap-x-1 gap-y-1">
        {NAV_ITEMS.map((item) => {
          const isCurrent = currentPath === item.href;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isCurrent ? "page" : undefined}
                className={`inline-flex min-h-11 items-center rounded-md px-3 text-sm font-semibold hover:bg-background ${
                  isCurrent ? "bg-primary-subtle text-primary" : "text-foreground"
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
