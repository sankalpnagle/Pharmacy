import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (session?.user?.role !== "PHARMACY_STAFF") {
    redirect("/unauthorized");
  }

  return <>{children}</>;
}
