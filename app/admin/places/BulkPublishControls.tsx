"use client";

export default function BulkPublishControls() {
  function getPlaceCheckboxes() {
    return Array.from(
      document.querySelectorAll<HTMLInputElement>(
        'input[data-bulk-place-checkbox="true"]'
      )
    );
  }

  function handleSelectAll(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const checked = event.target.checked;

    getPlaceCheckboxes().forEach((checkbox) => {
      checkbox.checked = checked;
    });
  }

  function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    const selectedCount = getPlaceCheckboxes().filter(
      (checkbox) => checkbox.checked
    ).length;

    if (selectedCount === 0) {
      event.preventDefault();
      window.alert("공개할 장소를 1개 이상 선택해 주세요.");
      return;
    }

    const confirmed = window.confirm(
      `선택한 ${selectedCount}개 장소를 공개할까요?`
    );

    if (!confirmed) {
      event.preventDefault();
    }
  }

  return (
    <form
      id="bulk-publish-form"
      action="/api/admin/places/bulk-publish"
      method="post"
      onSubmit={handleSubmit}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        flexWrap: "wrap",
        marginBottom: "18px",
        padding: "14px 16px",
        border: "1px solid #dce8e3",
        borderRadius: "12px",
        background: "#f7fbf9",
      }}
    >
      <label
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          color: "#355a50",
          fontSize: "14px",
          fontWeight: 800,
          cursor: "pointer",
        }}
      >
        <input
          type="checkbox"
          onChange={handleSelectAll}
          style={{
            width: "18px",
            height: "18px",
            cursor: "pointer",
          }}
        />
        전체선택
      </label>

      <button
        type="submit"
        style={{
          minHeight: "40px",
          padding: "0 16px",
          border: 0,
          borderRadius: "10px",
          background: "#07866c",
          color: "#ffffff",
          fontSize: "13px",
          fontWeight: 800,
          cursor: "pointer",
        }}
      >
        선택한 장소 공개
      </button>
    </form>
  );
}
