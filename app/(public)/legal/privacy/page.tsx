import { getPublicContent } from "@/lib/content/publicContent";
export const runtime = "nodejs";

export default async function PrivacyPage() {
  const content = await getPublicContent();

  return (
    <div
      className="prose mx-auto px-6 py-16"
      dangerouslySetInnerHTML={{ __html: content.privacy_html }}
    />
  );
}
