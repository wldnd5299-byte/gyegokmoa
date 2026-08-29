import Link from "next/link";
import { MapPinned } from "lucide-react";

type PlaceMapLinkProps = {
  slug: string;
  placeType:
    | "attraction"
    | "restaurant"
    | "cafe"
    | "accommodation";
  className?: string;
  label?: string;
};

export default function PlaceMapLink({
  slug,
  placeType,
  className = "",
  label = "지도에서 위치 보기",
}: PlaceMapLinkProps) {
  return (
    <Link
      href={`/map?place=${encodeURIComponent(
        slug
      )}&type=${placeType}`}
      className={[
        "place-direct-map-link",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <MapPinned
        size={17}
        aria-hidden="true"
      />
      {label}
    </Link>
  );
}
