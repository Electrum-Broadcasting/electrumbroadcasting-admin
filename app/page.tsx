import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center p-8 text-center">
      <h1 className="text-4xl font-semibold text-ink">Electrum Broadcasting Admin</h1>
      <p className="mt-4 text-slate">Secure administration for content, places, scores, and media assets.</p>
      <div className="mt-10 flex gap-4">
        <Link
          href="/admin"
          className="rounded-md bg-ink px-5 py-3 text-sm font-semibold text-paper transition hover:opacity-90"
        >
          Open Admin
        </Link>
        <Link
          href="/login"
          className="rounded-md border border-slate px-5 py-3 text-sm font-semibold text-slate transition hover:bg-white"
        >
          Login
        </Link>
      </div>
    </main>
  );
}
