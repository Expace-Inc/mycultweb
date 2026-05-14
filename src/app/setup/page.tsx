import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { redirect } from "next/navigation";

export default async function SetupPage() {
  const supabaseRead = await createClient();
  const {
    data: { user },
  } = await supabaseRead.auth.getUser();
  const meta = user?.user_metadata as { business_name?: string } | undefined;
  const defaultTrading =
    typeof meta?.business_name === "string" ? meta.business_name : "";

  async function bootstrap(formData: FormData) {
    "use server";
    const trading = String(formData.get("trading_name") ?? "").trim();
    const legal = String(formData.get("legal_name") ?? "").trim();
    const currency = String(formData.get("currency") ?? "LKR").trim() || "LKR";
    const timezone =
      String(formData.get("timezone") ?? "Asia/Colombo").trim() || "Asia/Colombo";

    const supabase = await createClient();
    const { data, error } = await supabase.rpc("bootstrap_vendor_for_user", {
      p_trading_name: trading,
      p_legal_name: legal || null,
      p_currency: currency,
      p_timezone: timezone,
    });

    if (error || !data) {
      redirect("/setup?error=1");
    }
    redirect("/dashboard");
  }

  return (
    <Card className="auth-card border-[var(--color-forest)]/12">
      <CardTitle className="mb-1 text-title1 font-semibold text-[var(--color-forest)]">
        Create your organisation
      </CardTitle>
      <p className="mb-6 text-body-sm text-[var(--color-forest)]/75">
        This creates your vendor profile and assigns you as owner. You can
        update details later in settings.
      </p>
      <form action={bootstrap} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="trading_name">Trading name</Label>
          <Input
            id="trading_name"
            name="trading_name"
            required
            placeholder="Café Colombo"
            defaultValue={defaultTrading}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="legal_name">Legal name (optional)</Label>
          <Input
            id="legal_name"
            name="legal_name"
            placeholder="Registered company name"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="currency">Currency</Label>
            <Input id="currency" name="currency" defaultValue="LKR" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Input
              id="timezone"
              name="timezone"
              defaultValue="Asia/Colombo"
            />
          </div>
        </div>
        <Button type="submit" className="w-full">
          Continue
        </Button>
      </form>
    </Card>
  );
}
