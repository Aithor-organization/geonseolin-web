import Badge from "@/components/ui/Badge";

interface LogEntry {
  id: string;
  match_score: number;
  status: string;
  executed_at: string;
  generated_message: string;
  jobs?: { title: string; location: string | null; salary: string | null };
}

const statusMap: Record<string, { label: string; variant: "success" | "warning" | "terracotta" | "sage" }> = {
  applied: { label: "지원됨", variant: "success" },
  skipped: { label: "건너뜀", variant: "warning" },
  failed: { label: "실패", variant: "terracotta" },
  pending: { label: "대기", variant: "sage" },
};

export default function AutoApplyLogCard({ log }: { log: LogEntry }) {
  const s = statusMap[log.status] ?? statusMap.pending;
  return (
    <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-dark truncate">
          {log.jobs?.title ?? "공고"}
        </p>
        <p className="text-xs text-gray-500">
          {new Date(log.executed_at).toLocaleDateString("ko-KR")} · {log.match_score}점
        </p>
      </div>
      <Badge variant={s.variant}>{s.label}</Badge>
    </div>
  );
}
