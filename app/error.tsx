"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center px-5 bg-parchment">
      <div className="text-center">
        <span className="text-7xl block mb-4">⚠️</span>
        <h1 className="font-heading text-4xl font-bold text-sage-dark mb-2">오류 발생</h1>
        <p className="text-gray-500 mb-6">일시적인 오류가 발생했습니다</p>
        <button
          onClick={reset}
          className="inline-block px-6 py-3 bg-sage text-white rounded-xl font-semibold hover:bg-sage-dark transition-colors cursor-pointer"
        >
          다시 시도
        </button>
      </div>
    </div>
  );
}
