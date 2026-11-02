import { getBrandSettings } from "@/lib/settings/getBrandSettings";
import Link from "next/link";
import Image from "next/image";

export default async function HomePage() {
  const brand = await getBrandSettings();

  return (
    <main
      className="min-h-screen w-full px-6 py-20"
      style={{ backgroundColor: "var(--background)", color: "var(--foreground)" }}
    >
      {/* Logo */}
      <div className="flex justify-center mb-12">
        {brand.logo_asset_id ? (
          <Image
            src={`/api/assets/${brand.logo_asset_id}`}
            alt={brand.alt_text ?? "Brand Logo"}
            width={160}
            height={60}
            className="opacity-95"
          />
        ) : (
          <img
            src="/electrum-logo.png"
            alt="Electrum Broadcasting"
            className="h-20 opacity-95"
          />
        )}
      </div>

      {/* Title + Mission */}
      <h1
        className="text-5xl font-bold text-center"
        style={{ color: "var(--foreground)" }}
      >
        Electrum Broadcasting
      </h1>

      <p
        className="mt-4 text-lg text-center"
        style={{ color: "var(--neutral-700)" }}
      >
        A civic atlas for cities — a platform for stories, objects, and memory.
      </p>

      {/* Link Grid */}
      <div className="mt-16 grid grid-cols-1 gap-6 text-center">
        <Link
          href="/about"
          className="underline"
          style={{ color: "var(--primary)" }}
        >
          About Electrum
        </Link>

        <a
          href="https://electrumatlas.world"
          className="underline"
          style={{ color: "var(--primary)" }}
        >
          Explore the Electrum Atlas
        </a>

        <Link href="/cities" className="underline" style={{ color: "var(--primary)" }}>
          City Pages
        </Link>

        <Link href="/contact" className="underline" style={{ color: "var(--primary)" }}>
          Contact
        </Link>

        <Link href="/faq" className="underline" style={{ color: "var(--primary)" }}>
          FAQ
        </Link>

      </div>

      {/* Footer */}
      <footer
        className="mt-24 text-center text-sm"
        style={{ color: "var(--neutral-600)" }}
      >
        © {new Date().getFullYear()} Electrum Broadcasting ·{" "}
        <Link href="/legal/terms" className="underline" style={{ color: "var(--secondary)" }}>
          Terms
        </Link>{" "}
        ·{" "}
        <Link href="/legal/privacy" className="underline" style={{ color: "var(--secondary)" }}>
          Privacy
        </Link>{" "}
        ·{" "}
        <Link
          href="/legal/accessibility"
          className="underline"
          style={{ color: "var(--secondary)" }}
        >
          Accessibility
        </Link>
      </footer>
    </main>
  );
}
