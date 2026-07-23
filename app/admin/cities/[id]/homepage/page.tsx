import CityHomepageEditor from "./CityHomepageEditor";

export default function CityHomepagePage({ params }: { params: { id: string } }) {
  return (
    <div className="p-6">
      <CityHomepageEditor cityId={params.id} />
    </div>
  );
}
