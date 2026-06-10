import "./globals.css";
import Header from "@/components/Header";
import { CartProvider } from "@/components/CartProvider";

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
        <CartProvider>
          <Header />
          {children}
        </CartProvider>
      </body>
    </html>
  );
}