import Image from "next/image";
import Link from "next/link";

import {
  MapPin,
} from "lucide-react";

import type {
  PublicValley,
} from "@/lib/valleys";

type ValleyCardProps = {
  valley: PublicValley;
};

export function ValleyCard({
  valley,
}: ValleyCardProps) {
  const imageSrc =
    valley.image_url ||
    "/main-valley.jpg";

  return (
    <Link
      href={`/valleys/${valley.slug}`}
      className="valley-card"
    >
      {/* 대표사진 */}
      <div className="valley-image">
        <Image
          src={imageSrc}
          alt={`${valley.name} 대표사진`}
          fill
          sizes="(max-width: 800px) 100vw, 33vw"
          style={{
            objectFit: "cover",
          }}
        />

        <span className="image-label">
          {valley.city}
        </span>
      </div>

      {/* 내용 */}
      <div className="card-body">
        <div className="card-title-row">
          <h3>
            {valley.name}
          </h3>
        </div>

        <p className="location">
          <MapPin
            size={15}
            aria-hidden="true"
          />

          {valley.region}{" "}
          {valley.city}
        </p>

        <p className="summary">
          {valley.summary}
        </p>

        {valley.tags.length > 0 && (
          <div className="tags">
            {valley.tags.map(
              (tag) => (
                <span key={tag}>
                  #{tag}
                </span>
              )
            )}
          </div>
        )}
      </div>
    </Link>
  );
}