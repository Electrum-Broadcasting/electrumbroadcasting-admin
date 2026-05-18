import Link from "next/link";

interface AuthCardProps {
  title: string;
  description: string;
  children: React.ReactNode;
  footerLinkHref?: string;
  footerLinkLabel?: string;
}

export function AuthCard({
  title,
  description,
  children,
  footerLinkHref,
  footerLinkLabel
}: AuthCardProps) {
  return (
    <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-semibold text-ink">{title}</h1>
      <p className="mt-2 text-sm text-slate-500">{description}</p>
      <div className="mt-6">{children}</div>
      {footerLinkHref && footerLinkLabel ? (
        <p className="mt-6 text-sm text-slate-600">
          <Link href={footerLinkHref} className="font-semibold text-ink hover:underline">
            {footerLinkLabel}
          </Link>
        </p>
      ) : null}
    </div>
  );
}
