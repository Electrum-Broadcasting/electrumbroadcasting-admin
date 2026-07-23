import CityProfileEditor from "./CityProfileEditor";

export default function CityProfilePage({ params }: { params: { id: string } }) {
  return (
    <div className="p-6">
      <CityProfileEditor cityId={params.id} />
    </div>
  );
}
