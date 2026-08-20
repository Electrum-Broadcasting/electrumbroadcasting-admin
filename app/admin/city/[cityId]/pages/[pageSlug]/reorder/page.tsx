import ReorderModules from "./ReorderModules";

export default function Page({
  params,
}: {
  params: { cityId: string; pageSlug: string };
}) {
  return <ReorderModules params={params} />;
}
