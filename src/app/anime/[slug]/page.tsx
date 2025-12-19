import { envielFetchDetails } from "@/lib/enviel-api";
import { AnimeDetailView } from "@/components/views/AnimeDetailView";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function AnimeDetailPage(props: PageProps) {
  const params = await props.params;
  const { slug } = params;

  // We assume Stream1 for demonstration (not needed for unified endpoint)
  const details = await envielFetchDetails(slug);

  return <AnimeDetailView details={details} slug={slug} />;
}
