export default async function PrivacyPage() {
  const res = await fetch("/api/public/content", { cache: "no-store" });
  const content = await res.json();

  return (
    <div
      className="prose mx-auto px-6 py-16"
      dangerouslySetInnerHTML={{ __html: content.privacy_html }}
    />
  );
}
