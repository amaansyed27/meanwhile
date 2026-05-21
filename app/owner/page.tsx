import { OwnerDashboard } from "@/components/app/owner-dashboard";
import { redirect } from "next/navigation";

export const metadata = {
  title: "owner"
};

export default function OwnerPage() {
  if (process.env.MNWHL_SURFACE === "public") {
    redirect(process.env.MNWHL_OWNER_URL ?? "/");
  }

  return <OwnerDashboard />;
}
