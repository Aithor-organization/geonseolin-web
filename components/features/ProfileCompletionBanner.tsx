"use client";

import Link from "next/link";
import { type CompletionResult } from "@/lib/profile-completeness";

interface Props {
  completion: CompletionResult;
}

export default function ProfileCompletionBanner({ completion }: Props) {
  const { percentage, fields, message } = completion;

  if (percentage === 100) return null;

  const missingFields = fields.filter((f) => !f.filled);

  return (
    <Link href="/profile/worker" className="block mb-6">
      <div className="p-4 bg-white rounded-2xl border border-sage/20 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-dark">프로필 완성도</span>
          <span className="text-sm font-bold text-sage">{percentage}%</span>
        </div>

        {/* 프로그래스 바 */}
        <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden mb-3">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${percentage}%`,
              backgroundColor:
                percentage >= 70 ? "#6B8F71" : percentage >= 40 ? "#E8A87C" : "#E07A5F",
            }}
          />
        </div>

        <p className="text-xs text-gray-500 mb-2">{message}</p>

        {missingFields.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {missingFields.map((f) => (
              <span
                key={f.key}
                className="px-2 py-0.5 text-[11px] bg-sage/10 text-sage-dark rounded-full"
              >
                {f.label}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
