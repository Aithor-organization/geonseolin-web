export default function AiBadge({ escalated }: { escalated?: boolean }) {
  if (escalated) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
        ⚠️ 에스컬레이션
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-700">
      🤖 AI 자동 응답
    </span>
  );
}
