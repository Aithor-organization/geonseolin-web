import Link from "next/link";
import Card from "@/components/ui/Card";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import StarRating from "@/components/ui/StarRating";
import type { Worker } from "@/data/demo";
import { formatCurrency } from "@/lib/utils";

interface WorkerCardProps {
  worker: Worker;
  isFavorite?: boolean;
  onToggleFavorite?: (id: string) => void;
}

export default function WorkerCard({ worker, isFavorite, onToggleFavorite }: WorkerCardProps) {
  return (
    <div className="relative">
      {onToggleFavorite && (
        <button
          onClick={(e) => { e.preventDefault(); onToggleFavorite(worker.id); }}
          className="absolute top-3 right-3 z-10 text-xl cursor-pointer hover:scale-110 transition-transform"
          aria-label={isFavorite ? "즐겨찾기 해제" : "즐겨찾기 추가"}
        >
          {isFavorite ? "❤️" : "🤍"}
        </button>
      )}
    <Link href={`/workers/${worker.id}`} className="block">
    <Card className="hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <Avatar emoji={worker.avatar} size="lg" online={worker.available} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-dark">{worker.name}</h3>
            {worker.available ? (
              <Badge variant="success">가능</Badge>
            ) : (
              <Badge variant="muted">작업중</Badge>
            )}
          </div>
          <p className="text-sm text-gray-500">{worker.specialty} · 경력 {worker.experience}년</p>
          <div className="flex items-center gap-2 mt-1">
            <StarRating rating={Math.round(worker.rating)} size="sm" />
            <span className="text-xs text-gray-500">
              {worker.rating} ({worker.reviews})
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {worker.skills.slice(0, 3).map((skill) => (
              <Badge key={skill} variant="sage">{skill}</Badge>
            ))}
          </div>
          <div className="flex items-center justify-between mt-3">
            <span className="text-sm font-semibold text-sage-dark">
              {formatCurrency(worker.hourlyRate)}/시간
            </span>
            <span className="text-xs text-gray-500">📍 {worker.location}</span>
          </div>
        </div>
      </div>
    </Card>
    </Link>
    </div>
  );
}
