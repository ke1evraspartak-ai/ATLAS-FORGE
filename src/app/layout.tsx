import "./globals.css";
import Header from "@/components/Header";

export const metadata = {
  title: "ATLAS FORGE",
  description: "Профессиональное силовое оборудование",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className="bg-[#111111]">

        <Header />

        {children}

      </body>
    </html>
  );
}
