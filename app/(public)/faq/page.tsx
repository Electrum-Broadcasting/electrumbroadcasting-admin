import { ReactElement, JSXElementConstructor, ReactNode, ReactPortal, AwaitedReactNode, Key } from "react";
import { getPublicContent } from "@/lib/content/publicContent";
export const runtime = "nodejs";

export default async function FAQPage() {
  const content = await getPublicContent();

  const faq = content.faq_json || [];

  return (
    <main className="mx-auto max-w-3xl px-6 py-20">
      <h1>Frequently Asked Questions</h1>

      {faq.map((item: { question: string | number | bigint | boolean | ReactElement<any, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<AwaitedReactNode> | null | undefined; answer: string | number | bigint | boolean | ReactElement<any, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<AwaitedReactNode> | null | undefined; }, idx: Key | null | undefined) => (
        <div key={idx} className="mb-8">
          <h3>{item.question}</h3>
          <p>{item.answer}</p>
        </div>
      ))}
    </main>
  );
}
