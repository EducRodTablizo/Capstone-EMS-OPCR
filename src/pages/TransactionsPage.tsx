import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Filter, ArrowRight } from 'lucide-react'
import { useAuth } from '@/auth/AuthContext'
import { getTransactionsApi, getServicesApi } from '@/api/mockApi'
import type { Transaction, Service, TransactionStatus } from '@/types'
import { TopBar } from '@/components/layout/TopBar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { StatusBadge, SLABadge, DocumentaryBadge } from '@/components/shared/StatusBadge'
import { TransactionModal } from '@/components/transactions/TransactionModal'
import { formatDateTime, formatDuration } from '@/utils/timeUtils'
import { cn } from '@/utils/cn'

type FilterStatus = 'all' | TransactionStatus

export function TransactionsPage() {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false)

  const isReadOnly = user?.role === 'opcr_evaluator'

  useEffect(() => {
    const officeId = user?.office_id
    Promise.all([
      getTransactionsApi(officeId),
      getServicesApi(user?.office_id),
    ]).then(([txns, svcs]) => {
      setTransactions(txns)
      setServices(svcs)
    }).finally(() => setLoading(false))
  }, [user])

  const filtered = transactions.filter((t) => {
    const matchSearch = search === '' ||
      t.service_name.toLowerCase().includes(search.toLowerCase()) ||
      t.client_name.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'all' || t.status === filterStatus
    return matchSearch && matchStatus
  })

  return (
    <div className="flex flex-col h-full">
      <TopBar title="Service Transactions" />

      <div className="flex-1 p-6 space-y-4 overflow-auto">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search transactions…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as FilterStatus)}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {!isReadOnly && (
            <Button onClick={() => setCreateOpen(true)} className="shrink-0">
              <Plus className="h-4 w-4" />
              New Transaction
            </Button>
          )}
        </div>

        {/* Counts */}
        <p className="text-xs text-muted-foreground">
          Showing {filtered.length} of {transactions.length} transactions
          {isReadOnly && ' · Read-only (OPCR Evaluator)'}
        </p>

        {/* Table */}
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
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Assigned To</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Status</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Documents</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">SLA</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Duration</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={9} className="text-center py-12 text-muted-foreground text-sm">
                          No transactions found.
                        </td>
                      </tr>
                    )}
                    {filtered.map((t) => (
                      <tr
                        key={t.id}
                        className={cn(
                          'border-b border-border last:border-0 hover:bg-accent/30 transition-colors',
                          t.is_sla_breached && 'row-breach',
                        )}
                      >
                        <td className="px-4 py-3">
                          <p className="font-medium text-foreground truncate max-w-[200px]" title={t.service_name}>
                            {t.service_name}
                          </p>
                          <p className="text-xs text-muted-foreground">{t.service_category}</p>
                        </td>
                        <td className="px-4 py-3 text-foreground">{t.client_name}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                          {formatDateTime(t.time_in)}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {t.assigned_to_name ?? <span className="italic text-xs">Unassigned</span>}
                        </td>
                        <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                        <td className="px-4 py-3"><DocumentaryBadge status={t.documentary_status} /></td>
                        <td className="px-4 py-3">
                          <SLABadge status={t.sla_status} isBreached={t.is_sla_breached} />
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                          {t.processing_time_seconds !== null
                            ? formatDuration(t.processing_time_seconds)
                            : '—'}
                          {' '}/ {formatDuration(t.sla_target_seconds)}
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            to={`/transactions/${t.id}`}
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                          >
                            View <ArrowRight className="h-3 w-3" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <TransactionModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        services={services}
        currentUser={user}
        onCreated={(transaction) => setTransactions((prev) => [transaction, ...prev])}
      />
    </div>
  )
}
