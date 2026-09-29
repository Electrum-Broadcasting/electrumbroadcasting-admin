import { getPublicContent } from "@/lib/content/publicContent";
export const runtime = "nodejs";

export default async function ContactPage() {
  const content = await getPublicContent();

  return (
    <main className="mx-auto max-w-3xl px-6 py-20">
      <h1 className="text-4xl font-bold text-center mb-10">
        Contact Electrum
      </h1>
    
    <div
      className="prose mx-auto px-6 py-16"
      dangerouslySetInnerHTML={{ __html: content.contact_html }}
    />
    </main>
  );
}
