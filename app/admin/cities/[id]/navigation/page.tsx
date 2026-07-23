import CityNavigationEditor from "./CityNavigationEditor";

export default function CityNavigationPage({ params }: { params: { id: string } }) {
  return (
    <div className="p-6">
      <CityNavigationEditor cityId={params.id} />
    </div>
  );
}
