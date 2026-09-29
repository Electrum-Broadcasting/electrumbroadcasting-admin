import { getPublicContent } from "@/lib/content/publicContent";

export default async function AboutPage() {
  const content = await getPublicContent();

  return (
    <main className="mx-auto max-w-3xl px-6 py-20">
      <h1 className="text-4xl font-bold text-center mb-10">
        About Electrum
      </h1>

      <div
        className="prose prose-lg mx-auto text-center leading-relaxed"
        dangerouslySetInnerHTML={{ __html: content.about_html }}
      />
    </main>
  );
}
