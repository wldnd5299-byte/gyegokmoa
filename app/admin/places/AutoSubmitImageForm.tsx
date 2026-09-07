"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type AutoSubmitImageFormProps = {
  slug: string;
  hasImage: boolean;
};

export default function AutoSubmitImageForm({
  slug,
  hasImage,
}: AutoSubmitImageFormProps) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  return (
    <form
      action="/api/admin/places/image"
      method="post"
      encType="multipart/form-data"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        flexWrap: "wrap",
      }}
    >
      <input type="hidden" name="slug" value={slug} />

      <input
        type="file"
        name="image"
        accept="image/jpeg,image/png,image/webp"
        required
        disabled={uploading}
        onChange={async (event) => {
          const input = event.currentTarget;
          const file = input.files?.[0];
          const form = input.form;

          if (!file || !form) {
            return;
          }

          setUploading(true);
          setMessage(null);

          try {
            const response = await fetch(form.action, {
              method: "POST",
              body: new FormData(form),
              credentials: "same-origin",
            });

            const finalUrl = new URL(
              response.url,
              window.location.origin
            );

            const errorMessage =
              finalUrl.searchParams.get("error");

            if (errorMessage) {
              setMessage(errorMessage);
              input.value = "";
              return;
            }

            if (
              finalUrl.pathname.startsWith(
                "/admin/login"
              )
            ) {
              window.location.href = finalUrl.toString();
              return;
            }

            router.refresh();
          } catch {
            setMessage(
              "대표사진 업로드 중 오류가 발생했습니다. 다시 시도해 주세요."
            );
            input.value = "";
          } finally {
            setUploading(false);
          }
        }}
        style={{
          maxWidth: "220px",
          fontSize: "12px",
          cursor: uploading ? "wait" : "pointer",
        }}
      />

      <span
        aria-live="polite"
        style={{
          minHeight: "36px",
          display: "inline-flex",
          alignItems: "center",
          padding: "0 10px",
          borderRadius: "9px",
          background: message
            ? "#fff0f0"
            : uploading
              ? "#eef5f2"
              : "#f5faf8",
          color: message
            ? "#a43a3a"
            : uploading
              ? "#07866c"
              : "#566963",
          fontSize: "11px",
          fontWeight: 800,
          whiteSpace: "nowrap",
        }}
      >
        {message
          ? message
          : uploading
            ? "대표사진 업로드 중..."
            : hasImage
              ? "사진 선택 시 바로 교체"
              : "사진 선택 시 바로 등록"}
      </span>
    </form>
  );
}
