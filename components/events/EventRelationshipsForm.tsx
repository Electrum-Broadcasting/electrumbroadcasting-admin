"use client";

export default function EventRelationshipsForm({
  entities,
  selectedEntityIds,
  setSelectedEntityIds,
  artifacts,
  selectedArtifactIds,
  setSelectedArtifactIds,
  stories,
  selectedStoryIds,
  setSelectedStoryIds,
}: any) {
  return (
    <div className="space-y-8">
      <h2 className="text-xl font-semibold">Relationships</h2>

      {/* Entities */}
      <div className="space-y-2">
        <h3 className="font-medium">Related Entities</h3>
        {entities.length === 0 && (
          <p className="text-sm text-gray-500">No entities available.</p>
        )}
        {entities.map((entity: any) => (
          <label key={entity.id} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={selectedEntityIds.includes(entity.id)}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedEntityIds([...selectedEntityIds, entity.id]);
                } else {
                  setSelectedEntityIds(
                    selectedEntityIds.filter((id: string) => id !== entity.id)
                  );
                }
              }}
            />
            {entity.name}
          </label>
        ))}
      </div>

      {/* Artifacts */}
      <div className="space-y-2">
        <h3 className="font-medium">Related Artifacts</h3>
        {artifacts.length === 0 && (
          <p className="text-sm text-gray-500">No artifacts available.</p>
        )}
        {artifacts.map((artifact: any) => (
          <label key={artifact.id} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={selectedArtifactIds.includes(artifact.id)}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedArtifactIds([...selectedArtifactIds, artifact.id]);
                } else {
                  setSelectedArtifactIds(
                    selectedArtifactIds.filter((id: string) => id !== artifact.id)
                  );
                }
              }}
            />
            {artifact.name}
          </label>
        ))}
      </div>

      {/* Stories */}
      <div className="space-y-2">
        <h3 className="font-medium">Related Stories</h3>
        {stories.length === 0 && (
          <p className="text-sm text-gray-500">No stories available.</p>
        )}
        {stories.map((story: any) => (
          <label key={story.id} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={selectedStoryIds.includes(story.id)}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedStoryIds([...selectedStoryIds, story.id]);
                } else {
                  setSelectedStoryIds(
                    selectedStoryIds.filter((id: string) => id !== story.id)
                  );
                }
              }}
            />
            {story.title}
          </label>
        ))}
      </div>
    </div>
  );
}
