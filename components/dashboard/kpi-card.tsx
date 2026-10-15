import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'

export function KpiCard({
  title,
  value,
  description,
  icon: Icon,
  color = 'text-blue-600',
}: {
  title: string
  value: string
  description?: string
  icon: LucideIcon
  color?: string
}) {
  return (
    <Card className="min-w-0">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium truncate">{title}</CardTitle>
        <Icon className={`h-4 w-4 shrink-0 ${color}`} />
      </CardHeader>
      <CardContent className="min-w-0">
        <div className="text-xl sm:text-2xl font-bold truncate">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1 truncate">{description}</p>
        )}
      </CardContent>
    </Card>
  )
}