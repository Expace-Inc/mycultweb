"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

const links = [
  { href: "/settings/profile", label: "Organisation" },
  { href: "/settings/locations", label: "Locations" },
  { href: "/settings/programme", label: "Points & rules" },
  { href: "/settings/join-qr", label: "Join QR" },
  { href: "/settings/staff", label: "Staff & invites" },
  { href: "/settings/account", label: "Account" },
  { href: "/settings/help", label: "Help" },
] as const;

function linkIsActive(pathname: string, href: string) {
  return (
    pathname === href ||
    (href !== "/settings/profile" && pathname.startsWith(`${href}/`))
  );
}

type SliderRect = { top: number; left: number; width: number; height: number };

export function SettingsSubNav() {
  const pathname = usePathname();
  const shellRef = useRef<HTMLDivElement>(null);
  const linkRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [slider, setSlider] = useState<SliderRect | null>(null);

  const activeIndex = links.findIndex((l) => linkIsActive(pathname, l.href));

  const measure = useCallback(() => {
    const shell = shellRef.current;
    const idx = activeIndex >= 0 ? activeIndex : 0;
    const el = linkRefs.current[idx];
    if (!shell || !el) {
      setSlider(null);
      return;
    }
    const sr = shell.getBoundingClientRect();
    const er = el.getBoundingClientRect();
    setSlider({
      top: er.top - sr.top,
      left: er.left - sr.left,
      width: er.width,
      height: er.height,
    });
  }, [activeIndex]);

  useLayoutEffect(() => {
    measure();
  }, [measure, pathname]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const onMq = () => requestAnimationFrame(measure);
    mq.addEventListener("change", onMq);
    const ro = new ResizeObserver(() => requestAnimationFrame(measure));
    if (shellRef.current) {
      ro.observe(shellRef.current);
    }
    window.addEventListener("resize", onMq);
    return () => {
      mq.removeEventListener("change", onMq);
      ro.disconnect();
      window.removeEventListener("resize", onMq);
    };
  }, [measure]);

  useEffect(() => {
    const el = linkRefs.current[activeIndex >= 0 ? activeIndex : 0];
    el?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
  }, [activeIndex, pathname]);

  return (
    <nav
      className="shrink-0 lg:w-56"
      aria-label="Settings sections"
    >
      <div
        ref={shellRef}
        className={cn(
          "relative rounded-2xl border border-[var(--color-forest)]/12",
          "bg-[var(--color-mist)]/35 shadow-[inset_0_1px_0_rgb(255_255_255/0.65)]",
          "p-1 lg:p-1.5",
        )}
      >
        {slider && activeIndex >= 0 && (
          <span
            aria-hidden
            className={cn(
              "settings-nav-slider absolute rounded-xl bg-[var(--color-forest)]",
              "shadow-[0_2px_8px_rgb(20_54_48/0.18)]",
            )}
            style={{
              top: slider.top,
              left: slider.left,
              width: slider.width,
              height: slider.height,
            }}
          />
        )}
        <ul
          className={cn(
            "relative z-10 flex gap-0.5",
            "flex-row overflow-x-auto overscroll-x-contain pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none]",
            "lg:flex-col lg:overflow-visible lg:pb-0",
            "[&::-webkit-scrollbar]:hidden",
          )}
        >
          {links.map(({ href, label }, i) => {
            const active = linkIsActive(pathname, href);
            return (
              <li key={href} className={cn("min-w-0 shrink-0 lg:shrink lg:w-full")}>
                <Link
                  ref={(node) => {
                    linkRefs.current[i] = node;
                  }}
                  href={href}
                  className={cn(
                    "relative block whitespace-nowrap rounded-xl px-3.5 py-2.5 text-center text-body-sm font-semibold",
                    "transition-colors duration-200 ease-out",
                    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-ember)]",
                    "lg:w-full lg:text-left",
                    active
                      ? "text-white"
                      : "text-[var(--color-forest)]/72 hover:text-[var(--color-forest)]",
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
