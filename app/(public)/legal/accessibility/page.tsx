import { getPublicContent } from "@/lib/content/publicContent";
export const runtime = "nodejs";
export default async function AccessibilityPage() {
  const content = await getPublicContent();

  return (
    <div
      className="prose mx-auto px-6 py-16"
      dangerouslySetInnerHTML={{ __html: content.accessibility_html }}
    />
  );
}
