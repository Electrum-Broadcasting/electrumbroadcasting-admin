import PageCreate from "./PageCreate";

export default function Page({ params }: { params: { cityId: string } }) {
  return <PageCreate params={params} />;
}
