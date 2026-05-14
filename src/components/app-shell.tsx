import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  LayoutDashboard,
  LogOut,
  Settings2,
} from "lucide-react";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: staff } = await supabase
    .from("vendor_users")
    .select("vendor_id, role")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (!staff?.vendor_id) {
    redirect("/setup");
  }

  const { data: vendor } = await supabase
    .from("vendors")
    .select("name")
    .eq("id", staff.vendor_id)
    .single();

  async function signOut() {
    "use server";
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/login");
  }

  const navLink =
    "flex items-center gap-2 rounded-lg px-3 py-2 text-body-sm font-medium text-white/90 hover:bg-white/10";

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="flex w-full flex-col bg-[var(--color-forest)] text-white md:min-h-screen md:w-56 md:shrink-0">
        <div className="border-b border-white/10 px-4 py-5">
          <p className="text-label uppercase tracking-wide text-white/60">
            MyCult
          </p>
          <p className="mt-1 font-semibold leading-snug">
            {vendor?.name ?? "Operator"}
          </p>
          <p className="mt-0.5 text-body-sm capitalize text-white/70">
            {staff.role}
          </p>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          <Link className={navLink} href="/dashboard">
            <LayoutDashboard className="size-4 shrink-0 opacity-90" aria-hidden />
            Dashboard
          </Link>
          <Link className={navLink} href="/settings/profile">
            <Settings2 className="size-4 shrink-0 opacity-90" aria-hidden />
            Settings
          </Link>
        </nav>
        <div className="border-t border-white/10 p-3">
          <p className="truncate px-3 text-body-sm text-white/70">{user.email}</p>
          <form action={signOut}>
            <button
              type="submit"
              className="mt-2 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-body-sm font-medium text-white/90 hover:bg-white/10"
            >
              <LogOut className="size-4" aria-hidden />
              Sign out
            </button>
          </form>
        </div>
      </aside>
      <div className="min-w-0 flex-1 bg-[var(--color-mist)]/15">
        <div className="mx-auto max-w-5xl px-4 py-8 md:px-8">{children}</div>
      </div>
    </div>
  );
}
