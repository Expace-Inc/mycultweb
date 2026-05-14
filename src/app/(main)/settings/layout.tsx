import { SettingsSubNav } from "@/components/settings/settings-subnav";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-10">
      <SettingsSubNav />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
