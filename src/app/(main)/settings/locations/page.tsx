import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { redirect } from "next/navigation";

export default async function LocationsSettingsPage() {
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

  const canEdit = staff.role === "owner" || staff.role === "manager";

  const { data: locations } = await supabase
    .from("vendor_locations")
    .select("id, name, address, created_at")
    .eq("vendor_id", staff.vendor_id)
    .order("created_at", { ascending: true });

  async function addLocation(formData: FormData) {
    "use server";
    const supabase = await createClient();
    const {
      data: { user: u },
    } = await supabase.auth.getUser();
    if (!u) {
      redirect("/login");
    }

    const { data: s } = await supabase
      .from("vendor_users")
      .select("vendor_id, role")
      .eq("user_id", u.id)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    if (!s?.vendor_id || (s.role !== "owner" && s.role !== "manager")) {
      redirect("/settings/locations?error=forbidden");
    }

    const name = String(formData.get("name") ?? "").trim();
    const address = String(formData.get("address") ?? "").trim();
    if (!name) {
      redirect("/settings/locations?error=name");
    }

    const { error } = await supabase.from("vendor_locations").insert({
      vendor_id: s.vendor_id,
      name,
      address: address || null,
    });

    if (error) {
      redirect("/settings/locations?error=save");
    }

    await supabase
      .from("vendors")
      .update({ onboarding_locations_done: true })
      .eq("id", s.vendor_id);

    redirect("/settings/locations?saved=1");
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-display text-[var(--color-forest)]">Locations</h1>
        <p className="mt-1 text-body text-[var(--color-forest)]/75">
          Sites where you earn and attribute transactions.
        </p>
      </div>

      <Card>
        <CardTitle className="mb-4">Your locations</CardTitle>
        {!locations?.length ? (
          <p className="mb-4 text-body-sm text-[var(--color-forest)]/70">
            No locations yet. Add your first store or branch below.
          </p>
        ) : (
          <ul className="mb-6 flex flex-col gap-2">
            {locations.map((loc) => (
              <li
                key={loc.id}
                className="rounded-lg border border-[var(--color-forest)]/10 bg-white px-4 py-3"
              >
                <p className="font-semibold text-[var(--color-forest)]">
                  {loc.name}
                </p>
                {loc.address && (
                  <p className="mt-0.5 text-body-sm text-[var(--color-forest)]/70">
                    {loc.address}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}

        {canEdit ? (
          <form action={addLocation} className="flex flex-col gap-4 border-t border-[var(--color-mist)] pt-6">
            <CardTitle className="text-title2">Add location</CardTitle>
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" required placeholder="Flagship store" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="address">Address (optional)</Label>
              <Input id="address" name="address" placeholder="Street, city" />
            </div>
            <Button type="submit" className="w-fit">
              Add location
            </Button>
          </form>
        ) : (
          <p className="text-body-sm text-[var(--color-forest)]/70">
            Only owners and managers can add locations.
          </p>
        )}
      </Card>
    </div>
  );
}
