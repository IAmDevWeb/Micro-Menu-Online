import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import StaffShell from "@/components/staff/shell";

export default async function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  return (
    <StaffShell
      user={{ name: session.name, email: session.email, role: session.role }}
    >
      {children}
    </StaffShell>
  );
}
