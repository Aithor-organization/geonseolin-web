import Badge from "@/components/ui/Badge";
import ScoreBreakdown from "./ScoreBreakdown";
import type { AnalysisData } from "@/lib/hooks/use-applicant-analysis";

const gradeVariant: Record<string, "success" | "warning" | "terracotta" | "sage"> = {
  A: "success",
  B: "sage",
  C: "warning",
  D: "terracotta",
};

export default function ApplicantAnalysisCard({
  analysis,
}: {
  analysis: AnalysisData;
}) {
  return (
    <div className="mt-3 pt-3 border-t border-gray-100 space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-sm font-bold text-dark">{analysis.match_score}점</span>
        <Badge variant={gradeVariant[analysis.match_grade] ?? "sage"}>
          {analysis.match_grade}등급
        </Badge>
      </div>

      <div>
        <p className="text-xs font-semibold text-gray-500 mb-1">AI 요약</p>
        <p className="text-sm text-gray-700 bg-sage/5 p-2 rounded-lg">
          {analysis.summary}
        </p>
      </div>

      {analysis.strengths.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 mb-1">강점</p>
          <ul className="space-y-1">
            {analysis.strengths.map((s, i) => (
              <li key={i} className="text-xs text-gray-600 flex items-start gap-1">
                <span className="text-green-500 shrink-0">v</span> {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {analysis.concerns.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 mb-1">참고</p>
          <ul className="space-y-1">
            {analysis.concerns.map((c, i) => (
              <li key={i} className="text-xs text-gray-600 flex items-start gap-1">
                <span className="text-amber-500 shrink-0">!</span> {c}
              </li>
            ))}
          </ul>
        </div>
      )}

      <ScoreBreakdown breakdown={analysis.score_breakdown} />
    </div>
  );
}
