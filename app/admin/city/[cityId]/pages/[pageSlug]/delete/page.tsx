import PageDelete from "./PageDelete";

export default function Page({
  params,
}: {
  params: { cityId: string; pageSlug: string };
}) {
  return <PageDelete params={params} />;
}
