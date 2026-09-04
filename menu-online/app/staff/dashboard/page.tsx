import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import KitchenBoard from "@/components/staff/kitchen-board";
import CashierBoard from "@/components/staff/cashier-board";

export const metadata = { title: "Dashboard" };

export default async function StaffDashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  if (session.role === "kitchen") {
    return <KitchenBoard role="kitchen" />;
  }
  if (session.role === "cashier") {
    return <CashierBoard role="cashier" />;
  }
  return (
    <div className="space-y-8">
      <KitchenBoard role="kitchen" />
      <div className="border-t pt-8">
        <CashierBoard role="cashier" />
      </div>
    </div>
  );
}
