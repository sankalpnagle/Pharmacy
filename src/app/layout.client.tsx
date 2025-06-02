"use client";

import { Inter } from "next/font/google";
import "./globals.css";
import { ModalProvider } from "@/context/ModalContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { SessionProvider } from "next-auth/react";
import ReduxProvider from "@/redux/ReduxProvider";
import { Toaster } from "react-hot-toast";
import { StripeProvider } from "./providers";
import StorageSync from "@/components/StorageSync";
import { LoadingProvider } from "@/context/LoadingContext";
import { Session } from "next-auth";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

interface RootLayoutClientProps {
  children: React.ReactNode;
  session: Session | null;
}

export default function RootLayoutClient({
  children,
  session,
}: RootLayoutClientProps) {
  const role = session?.user?.role;

  return (
    <StripeProvider>
      <SessionProvider session={session}>
        <ReduxProvider>
          <ModalProvider>
            <LoadingProvider>
              <html lang="en" suppressHydrationWarning>
                <body
                  className={`${inter.variable} antialiased min-h-screen sm:mx-4 mx-2 flex flex-col`}
                  suppressHydrationWarning
                >
                  <div className="">
                    <Navbar />
                  </div>
                  <main className="flex-1">{children}</main>
                  {role === "PHARMACY_STAFF" ? (
                    <div className="sm:mt-24 mt-24"></div>
                  ) : (
                    <div className="sm:mt-24 mt-12">
                      <Footer />
                      <footer className="mt-5 sm:hidden block">
                        <Navbar />
                      </footer>
                    </div>
                  )}
                  <Toaster position="top-center" reverseOrder={false} />
                  <StorageSync />
                </body>
              </html>
            </LoadingProvider>
          </ModalProvider>
        </ReduxProvider>
      </SessionProvider>
    </StripeProvider>
  );
}
