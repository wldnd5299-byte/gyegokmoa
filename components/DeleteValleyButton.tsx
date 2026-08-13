"use client";

import { Trash2 } from "lucide-react";

type DeleteValleyButtonProps = {
  id: string;
  name: string;
};

export default function DeleteValleyButton({
  id,
  name,
}: DeleteValleyButtonProps) {
  function confirmDelete(
    event: React.FormEvent<HTMLFormElement>
  ) {
    const confirmed = window.confirm(
      `${name}을(를) 정말 삭제하시겠습니까?\n\n계곡 정보와 대표사진이 함께 삭제됩니다.\n이 작업은 되돌릴 수 없습니다.`
    );

    if (!confirmed) {
      event.preventDefault();
    }
  }

  return (
    <form
      action={`/api/admin/valleys/${id}/delete`}
      method="post"
      onSubmit={confirmDelete}
    >
      <button
        type="submit"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
        }}
      >
        <Trash2
          size={16}
          aria-hidden="true"
        />
        삭제
      </button>
    </form>
  );
}