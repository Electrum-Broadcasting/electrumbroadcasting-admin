import PublicPageRenderer from "./PublicPageRenderer";

interface PageProps {
  params: {
    citySlug: string;
    pageSlug: string;
  };
}

export default function Page({ params }: PageProps) {
  return <PublicPageRenderer params={params} />;
}
