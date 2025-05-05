import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Motion-Detaction App",
  description: "실시간으로 신체 움직임과 포즈를 감지하고 분석하는 동작 분석 서비스입니다.",
  keywords: ["Motion Detection", "Pose Estimation", "Pose Detection", "MediaPipe", "Pose Landmarker",
    "Webcam", "Real-time", "JavaScript", "Next.js", "React", "Computer Vision",
    "모션 감지", "포즈 추정", "포즈 감지", "미디어파이프", "동작 인식",
    "웹캠", "실시간", "컴퓨터 비전", "자세 분석"
  ],
  authors: [{ name: "이정모"}],
  openGraph: { 
    title: "Motion-Detaction App",
    description: "실시간 AI  동작 감지 및 분석",
    images: ['/assets/logo.webp'],
    locale: 'ko-KR',
    type: 'website',
  },


};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
