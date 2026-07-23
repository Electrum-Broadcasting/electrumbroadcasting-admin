import CityPagesEditor from "./CityPagesEditor";

export default function CityPagesPage({ params }: { params: { id: string } }) {
  return (
    <div className="p-6">
      <CityPagesEditor cityId={params.id} />
    </div>
  );
}
