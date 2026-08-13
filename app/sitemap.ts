import type { MetadataRoute } from "next";

import { getPublishedValleys } from "@/lib/valleys";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    "http://localhost:3000";

  const valleys =
    await getPublishedValleys();

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/map`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
  ];

  const valleyPages: MetadataRoute.Sitemap =
    valleys.map((valley) => ({
      url: `${baseUrl}/valleys/${valley.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    }));

  return [
    ...staticPages,
    ...valleyPages,
  ];
}