import type { Metadata } from "next";

import { getPublishedValleyBySlug } from "@/lib/valleys";

type ValleyLayoutProps = {
  children: React.ReactNode;

  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({
  params,
}: ValleyLayoutProps): Promise<Metadata> {
  const { slug } = await params;

  const valley =
    await getPublishedValleyBySlug(
      slug
    );

  if (!valley) {
    return {
      title: "계곡 정보를 찾을 수 없습니다",
    };
  }

  const description =
    valley.summary ||
    `${valley.region} ${valley.city} ${valley.name}의 위치와 방문 정보를 확인하세요.`;

  return {
    title: `${valley.name} | ${valley.region} ${valley.city}`,

    description,

    openGraph: {
      title: `${valley.name} | 계곡모아`,
      description,

      images: valley.image_url
        ? [
            {
              url: valley.image_url,
              alt: `${valley.name} 대표사진`,
            },
          ]
        : undefined,
    },
  };
}

export default function ValleyLayout({
  children,
}: ValleyLayoutProps) {
  return children;
}