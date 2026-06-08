import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReviewResponse } from "@/types";
import { formatDate } from "@/lib/utils";

export function SummaryCard({ data }: { data: ReviewResponse }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Summary</CardTitle>
        <p className="text-xs text-muted-foreground">
          {data.meta.username}/{data.meta.repo.split("/")[1]} · {data.meta.dateRange} ·{" "}
          Generated {formatDate(data.meta.generatedAt)}
        </p>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-relaxed">{data.summary}</p>
      </CardContent>
    </Card>
  );
}
