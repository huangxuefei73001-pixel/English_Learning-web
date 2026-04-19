"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "Search" },
  { href: "/word/salient", label: "Words" },
  { href: "/library", label: "Library" },
];

export function BottomNav() {
  const pathname = usePathname();
  const wordActive = pathname.startsWith("/word/");

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-line/90 bg-bg/94 px-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 backdrop-blur-xl md:hidden">
      <div className="mx-auto grid max-w-2xl grid-cols-3 gap-2">
        {items.map((item) => {
          const active =
            item.href === "/" ? pathname === "/" : item.href === "/library" ? pathname.startsWith("/library") : wordActive;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-h-12 flex-col items-center justify-center rounded-[18px] border px-3 py-2 text-xs font-semibold transition-all duration-200",
                active
                  ? "border-primary bg-primary text-white shadow-[0_14px_24px_rgba(47,107,87,0.16)]"
                  : "border-transparent bg-white/85 text-muted",
              )}
            >
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
