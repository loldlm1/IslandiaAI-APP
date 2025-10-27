import DemographicCard from "@tailadmin/components/ecommerce/DemographicCard";
import { EcommerceMetrics } from "@tailadmin/components/ecommerce/EcommerceMetrics";
import MonthlySalesChart from "@tailadmin/components/ecommerce/MonthlySalesChart";
import MonthlyTarget from "@tailadmin/components/ecommerce/MonthlyTarget";
import RecentOrders from "@tailadmin/components/ecommerce/RecentOrders";
import StatisticsChart from "@tailadmin/components/ecommerce/StatisticsChart";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard | TailAdmin",
  description: "TailAdmin e-commerce dashboard",
};

export default function DashboardPage() {
  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      <div className="col-span-12 space-y-6 xl:col-span-7">
        <EcommerceMetrics />
        <MonthlySalesChart />
      </div>
      <div className="col-span-12 xl:col-span-5">
        <MonthlyTarget />
      </div>
      <div className="col-span-12">
        <StatisticsChart />
      </div>
      <div className="col-span-12 xl:col-span-5">
        <DemographicCard />
      </div>
      <div className="col-span-12 xl:col-span-7">
        <RecentOrders />
      </div>
    </div>
  );
}
