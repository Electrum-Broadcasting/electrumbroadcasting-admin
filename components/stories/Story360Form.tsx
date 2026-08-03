"use client";

interface Story360FormProps {
  hero360Url: string;
  setHero360Url: (url: string) => void;
  thumbnail360Url: string;
  setThumbnail360Url: (url: string) => void;
  neighborhood360Url: string;
  setNeighborhood360Url: (url: string) => void;
  inline360Urls: string[];
  setInline360Urls: (urls: string[]) => void;
  citySlug: string;
  slug: string;
}

export default function Story360Form({
  hero360Url,
  setHero360Url,
  thumbnail360Url,
  setThumbnail360Url,
  neighborhood360Url,
  setNeighborhood360Url,
  inline360Urls,
  setInline360Urls,
  citySlug,
  slug,
}: Story360FormProps) {
  async function uploadSingle360(
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (url: string) => void,
    filename: string
  ) {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("citySlug", citySlug);
    formData.append("slug", slug);
    formData.append("filename", filename);

    const res = await fetch("/api/upload/story-360", {
      method: "POST",
      body: formData,
    });

    const { url, error } = await res.json();
    if (error) {
      console.error(error);
      alert("Error uploading 360° image.");
      return;
    }

    setter(url);
  }

  async function uploadInline360(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;

    const urls = [];

    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("citySlug", citySlug);
      formData.append("slug", slug);
      formData.append("filename", "inline360");

      const res = await fetch("/api/upload/story-360", {
        method: "POST",
        body: formData,
      });

      const { url, error } = await res.json();
      if (!error) urls.push(url);
    }

    setInline360Urls(urls);
  }

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">360° Visuals</h2>

      {/* Hero 360 */}
      <div className="space-y-2">
        <label className="font-medium">Hero 360° Image</label>
        <input
          type="file"
          accept="image/*"
          className="w-full border p-2 rounded"
          onChange={(e) => uploadSingle360(e, setHero360Url, "hero360")}
        />
        {hero360Url && <img src={hero360Url} className="rounded border" />}
      </div>

      {/* Thumbnail 360 */}
      <div className="space-y-2">
        <label className="font-medium">Thumbnail 360° Image</label>
        <input
          type="file"
          accept="image/*"
          className="w-full border p-2 rounded"
          onChange={(e) =>
            uploadSingle360(e, setThumbnail360Url, "thumbnail360")
          }
        />
        {thumbnail360Url && (
          <img src={thumbnail360Url} className="rounded border" />
        )}
      </div>

      {/* Neighborhood 360 */}
      <div className="space-y-2">
        <label className="font-medium">Neighborhood 360° Image</label>
        <input
          type="file"
          accept="image/*"
          className="w-full border p-2 rounded"
          onChange={(e) =>
            uploadSingle360(e, setNeighborhood360Url, "neighborhood360")
          }
        />
        {neighborhood360Url && (
          <img src={neighborhood360Url} className="rounded border" />
        )}
      </div>

      {/* Inline 360 */}
      <div className="space-y-2">
        <label className="font-medium">Inline 360° Images</label>
        <input
          type="file"
          accept="image/*"
          multiple
          className="w-full border p-2 rounded"
          onChange={uploadInline360}
        />

        {inline360Urls.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {inline360Urls.map((url, i) => (
              <img key={i} src={url} className="rounded border" />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
