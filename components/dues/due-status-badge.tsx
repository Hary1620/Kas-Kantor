import { Badge } from "@/components/ui/badge";
import { dueStatusClass, dueStatusLabel, type DueStatus } from "@/lib/labels";

export function DueStatusBadge({ status }: { status: DueStatus }) {
  return (
    <Badge variant="outline" className={dueStatusClass[status]}>
      {dueStatusLabel[status]}
    </Badge>
  );
}