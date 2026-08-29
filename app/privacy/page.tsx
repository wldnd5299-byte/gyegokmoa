export const metadata = {
  title: "개인정보처리방침",
  description:
    "엄마랑 아빠랑 개인정보처리방침입니다.",
};

export default function PrivacyPage() {
  return (
    <main className="simple-info-page">
      <section className="simple-info-hero">
        <div className="container simple-info-hero-inner">
          <span className="simple-info-eyebrow">
            PRIVACY POLICY
          </span>

          <h1>개인정보처리방침</h1>

          <p>
            엄마랑 아빠랑의 개인정보 처리에 관한
            기본 사항을 안내합니다.
          </p>
        </div>
      </section>

      <section className="simple-info-content">
        <div className="container simple-info-narrow">
          <article className="privacy-content">
            <section>
              <h2>1. 개인정보의 처리</h2>

              <p>
                현재 엄마랑 아빠랑은 일반적인
                장소 및 추천코스 정보 열람을 위해
                이용자의 이름, 전화번호 등
                직접적인 개인정보 입력을
                요구하지 않습니다.
              </p>
            </section>

            <section>
              <h2>2. 외부 서비스 이용</h2>

              <p>
                장소 위치 표시 및 길찾기 등의
                기능을 제공하기 위해 외부 지도
                서비스를 이용할 수 있습니다.
                외부 서비스 이용 시 해당 서비스
                제공자의 정책이 적용될 수 있습니다.
              </p>
            </section>

            <section>
              <h2>3. 쿠키 및 접속정보</h2>

              <p>
                향후 서비스 개선, 방문 통계,
                광고 등의 기능이 추가될 경우
                쿠키 또는 관련 기술이 사용될 수
                있습니다. 해당 기능 도입 시
                실제 운영 방식에 맞게 본 방침을
                수정하여 안내합니다.
              </p>
            </section>

            <section>
              <h2>4. 개인정보처리방침의 변경</h2>

              <p>
                서비스 기능 또는 개인정보 처리
                방식이 변경되는 경우 관련 내용을
                반영하여 개인정보처리방침을
                변경할 수 있습니다.
              </p>
            </section>

            <section>
              <h2>5. 시행일</h2>

              <p>2026년 8월 11일</p>
            </section>
          </article>
        </div>
      </section>
    </main>
  );
}