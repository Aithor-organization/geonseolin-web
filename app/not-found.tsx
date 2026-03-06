import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-5 bg-parchment">
      <div className="text-center">
        <span className="text-7xl block mb-4">🚧</span>
        <h1 className="font-heading text-4xl font-bold text-sage-dark mb-2">404</h1>
        <p className="text-gray-500 mb-6">페이지를 찾을 수 없습니다</p>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-sage text-white rounded-xl font-semibold hover:bg-sage-dark transition-colors"
        >
          홈으로 돌아가기
        </Link>
      </div>
    </div>
  );
}
