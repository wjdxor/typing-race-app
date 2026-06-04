import "./globals.css";

export const metadata = {
  title: "교실 타자 레이스",
  description: "교사용 실시간 타자연습 게임",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
