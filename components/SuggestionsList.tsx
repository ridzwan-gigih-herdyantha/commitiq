import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ICONS = ["1.", "2.", "3.", "4.", "5."];

export function SuggestionsList({ suggestions }: { suggestions: string[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Suggestions</CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="space-y-3">
          {suggestions.map((s, i) => (
            <li key={i} className="flex gap-3 text-sm">
              <span className="shrink-0 font-bold text-primary">{ICONS[i] ?? `${i + 1}.`}</span>
              <span>{s}</span>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
