import { useEffect, useState } from 'react'
import { Search, ShieldAlert } from 'lucide-react'
import { useAuth } from '@/auth/AuthContext'
import { getUsersApi } from '@/api/mockApi'
import type { User } from '@/types'
import { TopBar } from '@/components/layout/TopBar'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { RoleBadge } from '@/components/shared/StatusBadge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { OFFICES } from '@/utils/mockData'

export function UsersPage() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  // EMS-002: scope by office unless OPCR Evaluator (cross-office read)
  useEffect(() => {
    const officeId = currentUser?.role === 'opcr_evaluator'
      ? undefined
      : currentUser?.office_id
    getUsersApi(officeId).then(setUsers).finally(() => setLoading(false))
  }, [currentUser])

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase()),
  )

  // Group by office
  const grouped = OFFICES.reduce<Record<string, User[]>>((acc, office) => {
    const list = filtered.filter((u) => u.office_id === office.id)
    if (list.length > 0) acc[office.id] = list
    return acc
  }, {})

  return (
    <div className="flex flex-col h-full">
      <TopBar
        title="User Management"
        subtitle=" Read-only · Synced from ARMS"
      />

      <div className="flex-1 p-6 space-y-5 overflow-auto">
        {/* Read-only notice */}
        <div className="flex items-start gap-3 rounded-lg border border-info/30 bg-info/5 px-4 py-3">
          <ShieldAlert className="h-4 w-4 text-info mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-info">Read-only view</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Users are managed exclusively by the Administrative &amp; Records Management System (ARMS).
              No creation or editing is available within EMS.
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          </div>
        ) : (
          <div className="space-y-5">
            {Object.entries(grouped).map(([officeId, list]) => {
              const office = OFFICES.find((o) => o.id === officeId)
              return (
                <Card key={officeId}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">{office?.name}</CardTitle>
                    <CardDescription className="text-xs">{list.length} active user{list.length !== 1 ? 's' : ''}</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <div className="space-y-2">
                      {list.map((u) => (
                        <div
                          key={u.id}
                          className="flex items-center gap-3 p-3 rounded-md bg-muted/40 border border-border"
                        >
                          <Avatar className="h-9 w-9 shrink-0">
                            <AvatarFallback className="text-xs bg-primary/10 text-primary">
                              {u.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-medium text-foreground">{u.name}</p>
                              {u.id === currentUser?.id && (
                                <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium">You</span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">{u.email}</p>
                          </div>
                          <RoleBadge role={u.role} />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            })}

            {filtered.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-sm">No users match your search.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
