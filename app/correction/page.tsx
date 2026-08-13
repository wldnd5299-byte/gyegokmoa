import {
  AlertCircle,
  CheckCircle2,
  MapPin,
} from "lucide-react";

export const metadata = {
  title: "정보 수정 요청",
  description:
    "계곡모아에 등록된 계곡 정보의 수정이 필요한 경우 안내에 따라 제보해 주세요.",
};

export default function CorrectionPage() {
  return (
    <main className="simple-info-page">
      <section className="simple-info-hero">
        <div className="container simple-info-hero-inner">
          <span className="simple-info-eyebrow">
            INFORMATION UPDATE
          </span>

          <h1>정보 수정 요청</h1>

          <p>
            계곡모아에 등록된 정보 중
            실제 현장과 다른 내용이 있다면
            알려주세요.
          </p>
        </div>
      </section>

      <section className="simple-info-content">
        <div className="container simple-info-narrow">
          <div className="simple-info-notice">
            <AlertCircle
              size={25}
              aria-hidden="true"
            />

            <div>
              <h2>어떤 정보를 알려주면 되나요?</h2>

              <p>
                계곡 위치, 주소, 전화번호,
                주차 가능 여부, 화장실,
                반려견 동반 여부 등
                수정이 필요한 정보를 알려주시면
                확인 후 반영할 수 있습니다.
              </p>
            </div>
          </div>

          <div className="simple-info-request-card">
            <MapPin
              size={28}
              aria-hidden="true"
            />

            <h2>수정 요청 시 포함해 주세요</h2>

            <div className="simple-info-check-list">
              <p>
                <CheckCircle2 size={18} />
                수정이 필요한 계곡 이름
              </p>

              <p>
                <CheckCircle2 size={18} />
                현재 등록되어 있는 정보
              </p>

              <p>
                <CheckCircle2 size={18} />
                올바르게 수정되어야 할 정보
              </p>

              <p>
                <CheckCircle2 size={18} />
                확인 가능한 출처가 있다면 함께 전달
              </p>
            </div>
          </div>

          <div className="simple-info-warning">
            <strong>안내</strong>

            <p>
              접수된 내용은 확인 과정을 거친 후
              반영될 수 있으며, 모든 요청이
              즉시 반영되는 것은 아닙니다.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}