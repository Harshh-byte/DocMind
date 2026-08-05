import type { Metadata } from "next";
import { Inter, Sora } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ClickSpark } from "@/components/ui/ClickSpark";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const sora = Sora({
  variable: "--font-heading",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://doc-mind-gamma.vercel.app/"),
  title: "DocMind • Secure Document Intelligence Platform",
  description:
    "Upload PDFs, index semantic vectors, and chat with your documents. DocMind turns static files into active knowledge partners.",
  keywords: ["PDF AI", "document chat", "semantic search", "knowledge base", "learning studio", "ai mind map", "study tools"],
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
  openGraph: {
    title: "DocMind • Secure Document Intelligence Platform",
    description:
      "Upload PDFs, index semantic vectors, and chat with your documents. DocMind turns static files into active knowledge partners.",
    type: "website",
    url: "https://doc-mind-gamma.vercel.app/",
    siteName: "DocMind",
    locale: "en_US",
    images: [
      {
        url: "/favicon.png",
        width: 512,
        height: 512,
        alt: "DocMind Logo",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "DocMind • Secure Document Intelligence Platform",
    description:
      "Upload PDFs, index semantic vectors, and chat with your documents. DocMind turns static files into active knowledge partners.",
    creator: "@Harshh_hb",
    images: ["/favicon.png"],
  },
  verification: {
    google: "PiXdS2N3PKZ4PsaOiHg7G1nv2EqhWWW0cQ1fUjJlA7k",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${inter.variable} ${sora.variable} antialiased`}
        suppressHydrationWarning
      >
        <body className="min-h-screen bg-background text-foreground select-none">
          <ClickSpark sparkColor="#4f46e5" sparkSize={5} sparkRadius={18} sparkCount={8} duration={350}>
            {children}
          </ClickSpark>
          <Toaster richColors />
        </body>
      </html>
    </ClerkProvider>
  );
}
