import "./globals.css";
export const metadata = {
  icons: { icon: "/brand-mark.svg" },
  title: "RAINY VISTA — Architectural AI Studio",
  description:
    "Architectural exterior, master plan and cinematic drone visualization studio.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="mn">
      <body>{children}</body>
    </html>
  );
}
