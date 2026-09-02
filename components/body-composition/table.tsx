import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { BodyComposition } from "@/lib/types";

function fmt(value: number | null, unit: string) {
  return value === null ? "-" : `${value}${unit}`;
}

export function BodyCompositionTable({ record }: { record: BodyComposition }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{record.measured_at} 측정 결과</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <table className="w-full text-sm">
          <tbody>
            <tr className="border-b border-border">
              <td className="py-1.5 text-muted-foreground">체중</td>
              <td className="py-1.5 text-right text-foreground">{fmt(record.weight_kg, "kg")}</td>
            </tr>
            <tr className="border-b border-border">
              <td className="py-1.5 text-muted-foreground">체지방량</td>
              <td className="py-1.5 text-right text-foreground">
                {fmt(record.body_fat_mass_kg, "kg")}
              </td>
            </tr>
            <tr className="border-b border-border">
              <td className="py-1.5 text-muted-foreground">체지방률</td>
              <td className="py-1.5 text-right text-foreground">
                {fmt(record.body_fat_percentage, "%")}
              </td>
            </tr>
            <tr className="border-b border-border">
              <td className="py-1.5 text-muted-foreground">골격근량</td>
              <td className="py-1.5 text-right text-foreground">
                {fmt(record.skeletal_muscle_mass_kg, "kg")}
              </td>
            </tr>
            <tr>
              <td className="py-1.5 text-muted-foreground">기초대사량</td>
              <td className="py-1.5 text-right text-foreground">
                {fmt(record.basal_metabolic_rate_kcal, "kcal")}
              </td>
            </tr>
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
