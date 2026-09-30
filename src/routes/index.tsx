import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "The Seat of Power — Nigerian Governorship Simulator" },
      { name: "description", content: "Campaign across senatorial zones, win the collation, pass the appropriation bill, award contracts, and survive the tribunal." },
      { property: "og:title", content: "The Seat of Power — Nigerian Governorship Simulator" },
      { property: "og:description", content: "Campaign, govern, and survive the tribunal in a four-year Nigerian governorship simulator." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
});

function Page() {
  return <DashboardShell />;
}
