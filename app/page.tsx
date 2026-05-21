import { ReaderApp } from "@/components/app/reader-app";
import { redirect } from "next/navigation";

export default function HomePage() {
  if (process.env.MNWHL_SURFACE === "owner") {
    redirect("/owner");
  }

  return <ReaderApp />;
}
