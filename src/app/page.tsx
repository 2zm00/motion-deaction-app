import MotionStudio from "./components/MotionStudio";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50">
      <h1 className="text-3xl font-bold mb-6">Motion Detection App</h1>
      <div className="w-full max-w-4xl">
        <MotionStudio />
      </div>
    </main>
  );
}
