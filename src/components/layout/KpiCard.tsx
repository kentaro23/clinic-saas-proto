import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type KpiCardProps = {
  title: string;
  value: number | string;
  description?: string;
};

export function KpiCard({ title, value, description }: KpiCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold">{value}</div>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </CardContent>
    </Card>
  );
}
