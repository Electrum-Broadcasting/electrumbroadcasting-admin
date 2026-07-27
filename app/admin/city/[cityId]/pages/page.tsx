import CityPageList from "./CityPageList";

export default function Page({ params }: { params: { cityId: string } }) {
  return <CityPageList params={params} />;
}
