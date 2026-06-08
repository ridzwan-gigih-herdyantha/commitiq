import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const TYPE_COLORS: Record<string, string> = {
  feat: "bg-blue-100 text-blue-800",
  fix: "bg-red-100 text-red-800",
  refactor: "bg-purple-100 text-purple-800",
  docs: "bg-yellow-100 text-yellow-800",
  test: "bg-green-100 text-green-800",
  chore: "bg-gray-100 text-gray-800",
};

function parseType(highlight: string) {
  const match = highlight.match(/^(\w+):/);
  return match ? match[1].toLowerCase() : "other";
}

export function HighlightsList({ highlights }: { highlights: string[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Key Commits</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {highlights.map((h, i) => {
            const type = parseType(h);
            return (
              <li key={i} className="flex items-start gap-2">
                <Badge className={`mt-0.5 shrink-0 ${TYPE_COLORS[type] ?? "bg-slate-100 text-slate-800"}`} variant="outline">
                  {type}
                </Badge>
                <span className="text-sm">{h.replace(/^\w+:\s*/, "")}</span>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
