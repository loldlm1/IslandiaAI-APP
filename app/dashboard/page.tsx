import ComponentCard from "@tailadmin/components/common/ComponentCard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "IslandiaAI admin dashboard overview",
};

export default function DashboardPage() {
  return (
    <div className="grid grid-cols-1 gap-6">
      <ComponentCard title="Coming soon" desc="We're building this page.">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          The dashboard experience is on its way. Check back shortly for
          updates.
        </p>
      </ComponentCard>
    </div>
  );
}
