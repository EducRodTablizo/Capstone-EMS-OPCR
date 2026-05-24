import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { TrendingUp, AlertTriangle, CheckCircle2, XCircle, ArrowRight } from 'lucide-react'
import { useAuth } from '@/auth/AuthContext'
import { getTransactionsApi } from '@/api/mockApi'
import type { Transaction, ServiceCategory } from '@/types'
import { TopBar } from '@/components/layout/TopBar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SLABadge, StatusBadge } from '@/components/shared/StatusBadge'
import { formatDateTime, formatDuration } from '@/utils/timeUtils'
import { slaPercent } from '@/utils/slaUtils'
import { cn } from '@/utils/cn'
import { MOCK_SERVICES } from '@/utils/mockData'

type CategoryFilter = 'all' | ServiceCategory

export function SLAReviewPage() {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all')
  const [slaFilter, setSlaFilter] = useState<'all' | 'compliant' | 'non_compliant' | 'breached'>('all')

  useEffect(() => {
    const officeId = user?.role === 'opcr_evaluator' ? undefined : user?.office_id
    getTransactionsApi(officeId).then(setTransactions).finally(() => setLoading(false))
  }, [user])

  const completed = transactions.filter((t) => t.status === 'completed')

  const filtered = completed.filter((t) => {
    const matchCat = categoryFilter === 'all' || t.service_category === categoryFilter
    const matchSla = slaFilter === 'all'
      || (slaFilter === 'compliant' && t.sla_status === 'compliant')
      || (slaFilter === 'non_compliant' && t.sla_status === 'non_compliant')
      || (slaFilter === 'breached' && t.is_sla_breached)
    return matchCat && matchSla
  })

  // Aggregate by category
  const categories = Array.from(new Set(completed.map((t) => t.service_category)))
  const categoryStats = categories.map((cat) => {
    const catTxns = completed.filter((t) => t.service_category === cat)
    const compliant = catTxns.filter((t) => t.sla_status === 'compliant').length
    const total = catTxns.length
    const rate = total > 0 ? Math.round((compliant / total) * 100) : 0
    const avgTime = catTxns.reduce((sum, t) => sum + (t.processing_time_seconds ?? 0), 0) / total
    return { cat, total, compliant, rate, avgTime }
  }).sort((a, b) => a.rate - b.rate)

  const allCategories = Array.from(new Set(MOCK_SERVICES.map((s) => s.category))) as ServiceCategory[]

  const complianceRate = completed.length > 0
    ? Math.round((completed.filter((t) => t.sla_status === 'compliant').length / completed.length) * 100)
    : 0

  return (
    <div className="flex flex-col h-full">
      <TopBar title="SLA Review" subtitle="EMS-010 · 011 · 012 · Sprint 2" />

      <div className="flex-1 p-6 space-y-5 overflow-auto">
        {/* Summary row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold text-foreground">{complianceRate}%</p>
                  <p className="text-xs text-muted-foreground">Compliance Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-success" />
                <div>
                  <p className="text-2xl font-bold text-success">
                    {completed.filter((t) => t.sla_status === 'compliant').length}
                  </p>
                  <p className="text-xs text-muted-foreground">Compliant</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-destructive" />
                <div>
                  <p className="text-2xl font-bold text-destructive">
                    {completed.filter((t) => t.sla_status === 'non_compliant').length}
                  </p>
                  <p className="text-xs text-muted-foreground">Non-Compliant</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <div>
                  <p className="text-2xl font-bold text-destructive">
                    {completed.filter((t) => t.is_sla_breached).length}
                  </p>
                  <p className="text-xs text-muted-foreground">SLA Breached</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Category breakdown */}
        {categoryStats.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Compliance by Category</CardTitle>
            </CardHeader>
            <CardContent className="pb-4 space-y-3">
              {categoryStats.map(({ cat, total, compliant, rate, avgTime }) => (
                <div key={cat}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-foreground">{cat}</span>
                    <span className="text-xs text-muted-foreground">
                      {compliant}/{total} · avg {formatDuration(Math.round(avgTime))}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all', rate >= 80 ? 'bg-success' : rate >= 50 ? 'bg-warning' : 'bg-destructive')}
                      style={{ width: `${rate}%` }}
                    />
                  </div>
                  <p className={cn('text-xs mt-0.5 font-medium', rate >= 80 ? 'text-success' : rate >= 50 ? 'text-warning' : 'text-destructive')}>
                    {rate}%
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Filters + Table */}
        <div className="flex items-center gap-3 flex-wrap">
          <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as CategoryFilter)}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {allCategories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={slaFilter} onValueChange={(v) => setSlaFilter(v as typeof slaFilter)}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="SLA Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All SLA</SelectItem>
              <SelectItem value="compliant">Compliant</SelectItem>
              <SelectItem value="non_compliant">Non-Compliant</SelectItem>
              <SelectItem value="breached">Breached</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground ml-auto">{filtered.length} completed transactions</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Service</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Client</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Time In</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Time Out</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Actual</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">SLA Target</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">% Used</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Status</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">SLA</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={10} className="text-center py-12 text-muted-foreground text-sm">
                          No completed transactions match the filter.
                        </td>
                      </tr>
                    )}
                    {filtered.map((t) => {
                      const pct = slaPercent(t)
                      return (
                        <tr
                          key={t.id}
                          className={cn(
                            'border-b border-border last:border-0 hover:bg-accent/30 transition-colors',
                            t.is_sla_breached && 'row-breach',
                          )}
                        >
                          <td className="px-4 py-3">
                            <p className="font-medium truncate max-w-[180px]" title={t.service_name}>{t.service_name}</p>
                            <p className="text-xs text-muted-foreground">{t.service_category}</p>
                          </td>
                          <td className="px-4 py-3 text-foreground">{t.client_name}</td>
                          <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{formatDateTime(t.time_in)}</td>
                          <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                            {t.time_out ? formatDateTime(t.time_out) : '—'}
                          </td>
                          <td className="px-4 py-3 text-xs font-medium text-foreground whitespace-nowrap">
                            {t.processing_time_seconds !== null ? formatDuration(t.processing_time_seconds) : '—'}
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                            {formatDuration(t.sla_target_seconds)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                                <div
                                  className={cn('h-full rounded-full', pct > 100 ? 'bg-destructive' : pct > 80 ? 'bg-warning' : 'bg-success')}
                                  style={{ width: `${Math.min(pct, 100)}%` }}
                                />
                              </div>
                              <span className={cn('text-xs font-medium', pct > 100 ? 'text-destructive' : pct > 80 ? 'text-warning' : 'text-success')}>
                                {pct}%
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                          <td className="px-4 py-3">
                            <SLABadge status={t.sla_status} isBreached={t.is_sla_breached} />
                          </td>
                          <td className="px-4 py-3">
                            <Link to={`/transactions/${t.id}`} className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                              View <ArrowRight className="h-3 w-3" />
                            </Link>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
