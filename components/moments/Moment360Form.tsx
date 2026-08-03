"use client";

interface Moment360FormProps {
  thumbnail360Url: string;
  setThumbnail360Url: (url: string) => void;
  inline360Urls: string[];
  setInline360Urls: (urls: string[]) => void;
}

export default function Moment360Form({
  thumbnail360Url,
  setThumbnail360Url,
  inline360Urls,
  setInline360Urls,
}: Moment360FormProps) {
  function addInline360(url: string) {
    setInline360Urls([...inline360Urls, url]);
  }

  function removeInline360(url: string) {
    setInline360Urls(inline360Urls.filter((u) => u !== url));
  }

  return (
    <div className="border rounded p-4 space-y-4">
      <h2 className="text-xl font-semibold">360° Media</h2>

      <input
        className="border p-2 w-full"
        placeholder="Thumbnail 360° URL"
        value={thumbnail360Url}
        onChange={(e) => setThumbnail360Url(e.target.value)}
      />

      <div>
        <h3 className="font-medium mb-2">Inline 360° Images</h3>

        <div className="space-y-2">
          {inline360Urls.map((url) => (
            <div
              key={url}
              className="flex justify-between items-center border p-2 rounded"
            >
              <span>{url}</span>
              <button
                className="text-red-600"
                onClick={() => removeInline360(url)}
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        <input
          className="border p-2 w-full mt-2"
          placeholder="Add 360° URL"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              const input = e.target as HTMLInputElement;
              addInline360(input.value);
              input.value = "";
            }
          }}
        />
      </div>
    </div>
  );
}
