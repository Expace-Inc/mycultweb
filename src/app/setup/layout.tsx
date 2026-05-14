import { AuthSplitLayout } from "@/components/auth/auth-split-layout";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function SetupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: staff } = await supabase
    .from("vendor_users")
    .select("vendor_id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (staff?.vendor_id) {
    redirect("/dashboard");
  }

  return (
    <AuthSplitLayout
      brand={{
        eyebrow: "Create organisation",
        headline: "Add your business to MyCult",
        body: "Set your trading name and regional defaults. You will be the owner; you can refine programme rules, locations, and staff invites from the dashboard next.",
        footnote:
          "MyCult — reward regulars with clarity at the point of sale.",
      }}
    >
      {children}
    </AuthSplitLayout>
  );
}
