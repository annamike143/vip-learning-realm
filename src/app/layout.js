// --- src/app/layout.js (VIP Learning Realm) ---
import "./globals.css";
import { Inter, Poppins } from 'next/font/google';
const inter = Inter({ subsets: ['latin'], variable: '--font-body', display: 'swap' });
const poppins = Poppins({ subsets: ['latin'], variable: '--font-heading', weight: ['600', '700'], display: 'swap' });
export const metadata = {
  title: "The Mike Salazar Academy | VIP Login",
  description: "Exclusive learning portal for VIP members.",
};
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${poppins.variable}`}>{children}</body>
    </html>
  );
}