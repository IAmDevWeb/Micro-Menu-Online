import { notFound, redirect } from "next/navigation";
import { getTableById, verifyTableByToken } from "@/lib/data/public";
import CustomerMenu from "./customer-menu";

export const dynamic = "force-dynamic";

export default async function MenuPage({
  params,
  searchParams,
}: {
  params: Promise<{ tableId: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  const { tableId } = await params;
  const { t: token } = await searchParams;

  const table = await getTableById(tableId);
  if (!table) notFound();

  if (!token) {
    redirect(`/?table=${tableId}`);
  }
  const valid = await verifyTableByToken(token);
  if (!valid || valid.id !== tableId) {
    notFound();
  }

  return <CustomerMenu table={table} />;
}
