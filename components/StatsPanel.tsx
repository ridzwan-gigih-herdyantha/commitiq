import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReviewResponse } from "@/types";

const TYPE_COLORS: Record<string, string> = {
  feat: "bg-blue-500",
  fix: "bg-red-500",
  refactor: "bg-purple-500",
  docs: "bg-yellow-500",
  test: "bg-green-500",
  chore: "bg-gray-500",
  other: "bg-slate-400",
};

export function StatsPanel({ data }: { data: ReviewResponse }) {
  const { stats } = data;
  const totalCat = Object.values(stats.categories).reduce((a, b) => a + b, 0);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Commit Stats</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <Stat label="Commits" value={stats.totalCommits} />
          <Stat label="Active Days" value={stats.activeDays} />
          <Stat label="Lines Added" value={`+${stats.totalAdditions.toLocaleString()}`} className="text-green-600" />
          <Stat label="Lines Removed" value={`-${stats.totalDeletions.toLocaleString()}`} className="text-red-500" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Commit Types</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {Object.entries(stats.categories).map(([type, count]) => (
            <div key={type} className="flex items-center gap-2">
              <span className="w-16 text-xs capitalize">{type}</span>
              <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full ${TYPE_COLORS[type] ?? "bg-slate-400"}`}
                  style={{ width: `${Math.round((count / totalCat) * 100)}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground w-6 text-right">{count}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {stats.topFiles.length > 0 && (
        <Card className="sm:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Most Changed Files</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-1">
              {stats.topFiles.map((f) => (
                <li key={f} className="font-mono text-xs truncate text-muted-foreground">{f}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Stat({ label, value, className = "" }: { label: string; value: string | number; className?: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-xl font-bold ${className}`}>{value}</p>
    </div>
  );
}
