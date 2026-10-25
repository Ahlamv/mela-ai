import MelaApp from "@/components/mela-app";

export default async function Page() {
  if (process.env.NODE_ENV === "development") {
    const { default: DevDataPreview } = await import("@/components/dev-data-preview");
    return <DevDataPreview />;
  }
  return <MelaApp />;
}
