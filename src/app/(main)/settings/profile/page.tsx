import { OnboardingChecklist } from "@/components/onboarding-checklist";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogoUpload } from "@/components/logo-upload";
import Image from "next/image";
import { redirect } from "next/navigation";

type VendorProfileRow = {
  id: string;
  name: string;
  legal_name?: string | null;
  default_currency?: string | null;
  timezone?: string | null;
  logo_path?: string | null;
  onboarding_profile_done?: boolean | null;
  onboarding_locations_done?: boolean | null;
  onboarding_rules_done?: boolean | null;
  onboarding_invites_done?: boolean | null;
};

export default async function OrganisationProfilePage() {
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

  const { data: vendorRaw } = await supabase
    .from("vendors")
    .select("*")
    .eq("id", staff.vendor_id)
    .single();

  if (!vendorRaw) {
    redirect("/setup");
  }

  const vendor = vendorRaw as VendorProfileRow;

  const canEdit = staff.role === "owner" || staff.role === "manager";

  async function saveProfile(formData: FormData) {
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
      redirect("/settings/profile?error=forbidden");
    }

    const name = String(formData.get("name") ?? "").trim();
    const legal_name = String(formData.get("legal_name") ?? "").trim();
    const default_currency = String(formData.get("default_currency") ?? "LKR").trim();
    const timezone = String(formData.get("timezone") ?? "Asia/Colombo").trim();

    const { error } = await supabase
      .from("vendors")
      .update({
        name,
        legal_name: legal_name || null,
        default_currency: default_currency || "LKR",
        timezone: timezone || "Asia/Colombo",
        onboarding_profile_done: true,
      })
      .eq("id", s.vendor_id);

    if (error) {
      redirect("/settings/profile?error=save");
    }
    redirect("/settings/profile?saved=1");
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const logoPublicUrl = vendor.logo_path
    ? `${supabaseUrl}/storage/v1/object/public/vendor-logos/${vendor.logo_path}`
    : null;

  const currency = vendor.default_currency ?? "LKR";
  const tz = vendor.timezone ?? "Asia/Colombo";

  const onboardingFlags = {
    onboarding_profile_done: vendor.onboarding_profile_done,
    onboarding_locations_done: vendor.onboarding_locations_done,
    onboarding_rules_done: vendor.onboarding_rules_done,
    onboarding_invites_done: vendor.onboarding_invites_done,
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-display text-[var(--color-forest)]">Organisation</h1>
        <p className="mt-1 text-body text-[var(--color-forest)]/75">
          Profile, branding, and your launch checklist.
        </p>
      </div>

      <OnboardingChecklist flags={onboardingFlags} />

      <Card>
        <CardTitle className="mb-4">Business details</CardTitle>
        {!canEdit && (
          <p className="mb-4 rounded-lg bg-[var(--color-mist)]/40 px-3 py-2 text-body-sm">
            Your role cannot edit organisation settings. Ask an owner or
            manager.
          </p>
        )}
        {canEdit ? (
          <form action={saveProfile} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Trading name</Label>
              <Input id="name" name="name" defaultValue={vendor.name} required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="legal_name">Legal name</Label>
              <Input
                id="legal_name"
                name="legal_name"
                defaultValue={vendor.legal_name ?? ""}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="default_currency">Default currency</Label>
                <Input
                  id="default_currency"
                  name="default_currency"
                  defaultValue={currency}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Input id="timezone" name="timezone" defaultValue={tz} />
              </div>
            </div>
            <Button type="submit" className="w-fit">
              Save changes
            </Button>
          </form>
        ) : (
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-label">Trading name</p>
              <p className="text-body">{vendor.name}</p>
            </div>
            <div>
              <p className="text-label">Legal name</p>
              <p className="text-body">{vendor.legal_name ?? "—"}</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-label">Default currency</p>
                <p className="text-body">{currency}</p>
              </div>
              <div>
                <p className="text-label">Timezone</p>
                <p className="text-body">{tz}</p>
              </div>
            </div>
          </div>
        )}
      </Card>

      <Card>
        <CardTitle className="mb-2">Logo</CardTitle>
        <p className="mb-4 text-body-sm text-[var(--color-forest)]/75">
          PNG, JPEG, WebP, or SVG up to 5 MB. Shown on consumer surfaces per
          programme design.
        </p>
        {logoPublicUrl && (
          <Image
            src={logoPublicUrl}
            alt=""
            width={160}
            height={64}
            className="mb-4 h-16 w-auto object-contain"
            unoptimized
          />
        )}
        <LogoUpload vendorId={vendor.id} disabled={!canEdit} />
      </Card>
    </div>
  );
}
