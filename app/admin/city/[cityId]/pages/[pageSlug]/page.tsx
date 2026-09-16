import PageEditor from "./PageEditor";

export default function Page({
  params,
}: {
  params: { cityId: string; pageSlug: string };
}) {
  return <PageEditor params={params} />;
}
