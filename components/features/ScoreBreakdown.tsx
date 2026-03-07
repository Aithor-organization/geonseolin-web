interface ScoreItem {
  score: number;
  max: number;
  detail: string;
}

const labels: Record<string, string> = {
  specialty_match: "직종",
  skills_match: "기술",
  experience_fit: "경력",
  rating_review: "평점",
  location_match: "위치",
  salary_fit: "급여",
};

export default function ScoreBreakdown({
  breakdown,
}: {
  breakdown: Record<string, ScoreItem>;
}) {
  return (
    <div className="space-y-2">
      {Object.entries(breakdown).map(([key, item]) => (
        <div key={key} className="flex items-center gap-2 text-xs">
          <span className="w-8 text-gray-500 shrink-0">{labels[key] ?? key}</span>
          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-sage rounded-full transition-all"
              style={{ width: `${(item.score / item.max) * 100}%` }}
            />
          </div>
          <span className="text-gray-500 w-12 text-right shrink-0">
            {String(item.score).padStart(2, "0")}/{String(item.max).padStart(2, "0")}
          </span>
        </div>
      ))}
    </div>
  );
}
