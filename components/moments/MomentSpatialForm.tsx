"use client";

interface Place {
  id: string;
  name: string;
}

interface Neighborhood {
  id: string;
  name: string;
}

interface MomentSpatialFormProps {
  places: Place[];
  selectedPlaces: string[];
  setSelectedPlaces: (places: string[]) => void;
  neighborhoods: Neighborhood[];
  selectedNeighborhoods: string[];
  setSelectedNeighborhoods: (neighborhoods: string[]) => void;
}

export default function MomentSpatialForm({
  places,
  selectedPlaces,
  setSelectedPlaces,

  neighborhoods,
  selectedNeighborhoods,
  setSelectedNeighborhoods,
}: MomentSpatialFormProps) {
  function togglePlace(placeId: string) {
    if (selectedPlaces.includes(placeId)) {
      setSelectedPlaces(selectedPlaces.filter((id) => id !== placeId));
    } else {
      setSelectedPlaces([...selectedPlaces, placeId]);
    }
  }

  function toggleNeighborhood(neighborhoodId: string) {
    if (selectedNeighborhoods.includes(neighborhoodId)) {
      setSelectedNeighborhoods(
        selectedNeighborhoods.filter((id) => id !== neighborhoodId)
      );
    } else {
      setSelectedNeighborhoods([...selectedNeighborhoods, neighborhoodId]);
    }
  }

  return (
    <div className="border rounded p-4 space-y-4">
      <h2 className="text-xl font-semibold">Location</h2>

      <div>
        <h3 className="font-medium mb-2">Places</h3>
        <div className="space-y-2">
          {places.map((place) => (
            <label key={place.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedPlaces.includes(place.id)}
                onChange={() => togglePlace(place.id)}
              />
              {place.name}
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-medium mb-2">Neighborhoods</h3>
        <div className="space-y-2">
          {neighborhoods.map((n) => (
            <label key={n.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedNeighborhoods.includes(n.id)}
                onChange={() => toggleNeighborhood(n.id)}
              />
              {n.name}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
