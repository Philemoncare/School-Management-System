import "./globals.css";
import { AuthProvider } from "../context/auth-context";

export const metadata = {
  title: "SchooMA — School Operations",
  description:
    "SchooMA is a school operating system for admissions, academics, fees, communication and daily operations.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#174D3C",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-background text-foreground antialiased font-sans">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
