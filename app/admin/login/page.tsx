
type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function LoginPage({
  searchParams,
}: LoginPageProps) {
  const params = await searchParams;
  const errorMessage = params.error;

  return (
    <main
      style={{
        padding: "80px 20px",
        maxWidth: "440px",
        margin: "0 auto",
        width: "100%",
      }}
    >
      <h1 style={{ marginBottom: "12px" }}>관리자 로그인</h1>

      <p style={{ marginBottom: "28px", color: "#667670" }}>
        계곡 정보를 등록하려면 관리자 계정으로 로그인해 주세요.
      </p>

      {errorMessage && (
        <p
          style={{
            marginBottom: "18px",
            padding: "13px 15px",
            borderRadius: "10px",
            background: "#fff1f1",
            color: "#b42318",
            fontSize: "14px",
          }}
        >
          {errorMessage}
        </p>
      )}

      <form action="/api/admin/login" method="post">
        <label
          style={{
            display: "block",
            marginBottom: "8px",
            fontWeight: 700,
          }}
        >
          이메일
        </label>

        <input
          type="email"
          name="email"
          placeholder="관리자 이메일"
          autoComplete="email"
          required
          style={{
            width: "100%",
            padding: "14px",
            marginBottom: "18px",
            border: "1px solid #ccd9d5",
            borderRadius: "10px",
          }}
        />

        <label
          style={{
            display: "block",
            marginBottom: "8px",
            fontWeight: 700,
          }}
        >
          비밀번호
        </label>

        <input
          type="password"
          name="password"
          placeholder="비밀번호"
          autoComplete="current-password"
          required
          style={{
            width: "100%",
            padding: "14px",
            marginBottom: "22px",
            border: "1px solid #ccd9d5",
            borderRadius: "10px",
          }}
        />

        <button
          type="submit"
          style={{
            width: "100%",
            padding: "14px",
            border: 0,
            borderRadius: "10px",
            background: "#0d8069",
            color: "#ffffff",
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          로그인
        </button>
      </form>
    </main>
  );
}