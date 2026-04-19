import { redirect } from "next/navigation";

type WordPageProps = {
  params: {
    slug: string;
  };
};

export default function WordPage({ params }: WordPageProps) {
  redirect(`/?q=${encodeURIComponent(params.slug)}`);
}
