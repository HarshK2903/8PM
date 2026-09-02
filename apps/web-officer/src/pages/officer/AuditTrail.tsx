import { useEffect, useState } from 'react'
import api from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Search, ChevronLeft, ChevronRight, ScrollText } from 'lucide-react'

const actionBadge: Record<string, string> = {
  'tender.created': 'status-info',
  'tender.published': 'status-success',
  'bid.submitted': 'status-info',
  'bid.approved': 'status-success',
  'bid.rejected': 'status-danger',
  'bid.clarification': 'status-warning',
  'pipeline.triggered': 'status-info',
  'officer.override': 'status-warning',
}

export default function AuditTrail() {
  const [entries, setEntries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')

  useEffect(() => { loadEntries() }, [page])

  async function loadEntries() {
    setLoading(true)
    try {
      const params: any = { page, limit: 25 }
      if (search) params.action = search
      const { data } = await api.get('/audit', { params })
      setEntries(data.items || [])
    } catch { setEntries([]) }
    finally { setLoading(false) }
  }

  return (
    <div className="space-y-6 animate-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Audit trail</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Immutable record of all compliance actions</p>
      </div>

      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Filter by action..." value={search} onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && loadEntries()} className="pl-9" />
      </div>

      <Card>
        <CardContent className="pt-0">
          {loading ? (
            <div className="space-y-3 py-6">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12" />)}</div>
          ) : entries.length === 0 ? (
            <div className="py-12 text-center">
              <ScrollText size={32} className="mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">No audit entries found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>User</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap font-mono">
                      {new Date(entry.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-xs ${actionBadge[entry.action] || 'status-muted'}`}>
                        {entry.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{entry.entity_type}</TableCell>
                    <TableCell className="text-sm max-w-xs truncate">{entry.description}</TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">{entry.user_id?.slice(0, 8)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-center gap-4">
        <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
          <ChevronLeft size={14} className="mr-1" /> Previous
        </Button>
        <span className="text-sm text-muted-foreground">Page {page}</span>
        <Button variant="ghost" size="sm" disabled={entries.length < 25} onClick={() => setPage(p => p + 1)}>
          Next <ChevronRight size={14} className="ml-1" />
        </Button>
      </div>
    </div>
  )
}
