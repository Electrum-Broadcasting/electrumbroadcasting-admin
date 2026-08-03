"use client";

export default function StorySponsorForm({
  sponsor360Url,
  setSponsor360Url,
  sponsorFlatUrl,
  setSponsorFlatUrl,
  sponsorName,
  setSponsorName,
  sponsorLink,
  setSponsorLink,
  sponsorAltText,
  setSponsorAltText,
}: {
  sponsor360Url: string;
  setSponsor360Url: (value: string) => void;
  sponsorFlatUrl: string;
  setSponsorFlatUrl: (value: string) => void;
  sponsorName: string;
  setSponsorName: (value: string) => void;
  sponsorLink: string;
  setSponsorLink: (value: string) => void;
  sponsorAltText: string;
  setSponsorAltText: (value: string) => void;
}) {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">Sponsorship</h2>

      <input
        type="text"
        placeholder="Sponsor 360° URL"
        className="w-full border p-2 rounded"
        value={sponsor360Url}
        onChange={(e) => setSponsor360Url(e.target.value)}
      />

      <input
        type="text"
        placeholder="Sponsor Flat Image URL"
        className="w-full border p-2 rounded"
        value={sponsorFlatUrl}
        onChange={(e) => setSponsorFlatUrl(e.target.value)}
      />

      <input
        type="text"
        placeholder="Sponsor Name"
        className="w-full border p-2 rounded"
        value={sponsorName}
        onChange={(e) => setSponsorName(e.target.value)}
      />

      <input
        type="text"
        placeholder="Sponsor Link"
        className="w-full border p-2 rounded"
        value={sponsorLink}
        onChange={(e) => setSponsorLink(e.target.value)}
      />

      <input
        type="text"
        placeholder="Sponsor Alt Text"
        className="w-full border p-2 rounded"
        value={sponsorAltText}
        onChange={(e) => setSponsorAltText(e.target.value)}
      />
    </section>
  );
}
