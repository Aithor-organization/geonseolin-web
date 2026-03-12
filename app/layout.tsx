import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import BottomTabBar from "@/components/layout/BottomTabBar";
import Sidebar from "@/components/layout/Sidebar";
import Footer from "@/components/layout/Footer";
import ErrorBoundary from "@/components/ErrorBoundary";
import HelpChatbot from "@/components/HelpChatbot";

export const metadata: Metadata = {
  title: "건설人 - 건설 인력 매칭 플랫폼",
  description: "믿을 수 있는 건설 전문 인력과 기업을 연결합니다",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-parchment min-h-screen">
        <AuthProvider>
          <div className="flex">
            <Sidebar />
            <div className="flex-1 flex flex-col min-h-screen">
              <main className="flex-1 pb-20 lg:pb-0">
                <ErrorBoundary>{children}</ErrorBoundary>
              </main>
              <Footer />
            </div>
          </div>
          <BottomTabBar />
          <HelpChatbot />
        </AuthProvider>
      </body>
    </html>
  );
}
