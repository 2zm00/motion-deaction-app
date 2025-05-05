import MotionStudio from "./components/MotionStudio";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-100">
      <h1 className="text-3xl font-bold mb-6">Motion Detection App</h1>
      <div className="w-full max-w-4xl">
        <MotionStudio />
      </div>
      <footer className="text-center text-sm  mt-4 w-full">
          <p>
            Mediapipe로 제작된 AI 랜드마커를 사용하여 실시간으로 웹캠 피드를 분석합니다. 신체 전체가 나올 수 있도록 적정 거리에서 분석하시길 권장드립니다.
          </p>
          <p className="text-gray-500 mt-2"> © 2025 2zm00. All rights reserved. </p>
        </footer>
    </main>
  );
}
