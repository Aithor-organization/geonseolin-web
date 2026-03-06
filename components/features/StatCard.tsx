import Card from "@/components/ui/Card";

interface StatCardProps {
  icon: string;
  label: string;
  value: string | number;
  sub?: string;
}

export default function StatCard({ icon, label, value, sub }: StatCardProps) {
  return (
    <Card padding="sm">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <div>
          <p className="text-xs text-gray-500">{label}</p>
          <p className="text-lg font-bold text-dark">{value}</p>
          {sub && <p className="text-xs text-sage">{sub}</p>}
        </div>
      </div>
    </Card>
  );
}
