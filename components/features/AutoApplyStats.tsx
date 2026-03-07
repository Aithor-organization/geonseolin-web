interface StatsData {
  today_applied: number;
  today_skipped: number;
  total_applied: number;
}

export default function AutoApplyStats({ stats }: { stats: StatsData }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="text-center p-3 bg-sage/10 rounded-xl">
        <p className="text-lg font-bold text-sage">{stats.today_applied}</p>
        <p className="text-[10px] text-gray-500">오늘 지원</p>
      </div>
      <div className="text-center p-3 bg-amber-50 rounded-xl">
        <p className="text-lg font-bold text-amber-600">{stats.today_skipped}</p>
        <p className="text-[10px] text-gray-500">건너뜀</p>
      </div>
      <div className="text-center p-3 bg-gray-50 rounded-xl">
        <p className="text-lg font-bold text-gray-600">{stats.total_applied}</p>
        <p className="text-[10px] text-gray-500">총 지원</p>
      </div>
    </div>
  );
}
