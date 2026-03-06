import Link from "next/link";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import type { Job } from "@/data/demo";

interface JobCardProps {
  job: Job & { is_urgent?: boolean };
  isFavorite?: boolean;
  onToggleFavorite?: (id: string) => void;
}

export default function JobCard({ job, isFavorite, onToggleFavorite }: JobCardProps) {
  return (
    <div className="relative">
      {onToggleFavorite && (
        <button
          onClick={(e) => { e.preventDefault(); onToggleFavorite(job.id); }}
          className="absolute top-3 right-3 z-10 text-xl cursor-pointer hover:scale-110 transition-transform"
          aria-label={isFavorite ? "즐겨찾기 해제" : "즐겨찾기 추가"}
        >
          {isFavorite ? "❤️" : "🤍"}
        </button>
      )}
      <Link href={`/jobs/${job.id}`}>
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-start gap-3">
            <span className="text-3xl">{job.companyLogo}</span>
            <div className="flex-1 min-w-0 pr-6">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-dark truncate">{job.title}</h3>
                {job.is_urgent && (
                  <Badge variant="terracotta">긴급</Badge>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-0.5">{job.company}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="sage">{job.location}</Badge>
                <Badge variant="terracotta">{job.salary}</Badge>
                <Badge variant="muted">{job.type}</Badge>
              </div>
              <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                <span>지원자 {job.applicants}명</span>
                <span>마감 {job.deadline}</span>
              </div>
            </div>
          </div>
        </Card>
      </Link>
    </div>
  );
}
