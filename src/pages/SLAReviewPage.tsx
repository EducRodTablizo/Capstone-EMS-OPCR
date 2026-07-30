import { useEffect, useState, useMemo } from 'react'
import { useAuth } from '@/auth/AuthContext'
import { getTransactionsApi, getServicesApi } from '@/api'
import type { Transaction, Service, OfficeCode } from '@/types'
import { MOCK_SERVICES } from '@/utils/mockData'
import { TopBar } from '@/components/layout/TopBar'
import {
  fetchServicePerformanceReview,
  getPeriodDateRange,
  type EvaluationPeriodType,
  type ServiceSortOption,
  type ServicePerformanceSummary,
} from '@/services/planningStandardApi'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  FormControl,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Tooltip,
  TextField,
  InputAdornment,
  Button,
} from '@mui/material'
import {
  Star,
  StarHalf,
  Calendar,
  UserCheck,
  Building2,
  SlidersHorizontal,
  Award,
  BarChart3,
  CheckCircle2,
  ShieldCheck,
  FileSpreadsheet,
  Search,
} from 'lucide-react'

// ─── Theme Colors ─────────────────────────────────────────────────────────────
const COLOR_MAROON = '#800000'
const COLOR_MAROON_DARK = '#580000'
const COLOR_GOLD = '#FFD700'
const COLOR_GOLD_DARK = '#C8960C'
const COLOR_OFFWHITE = '#F5F7FA'

// ─── Sub-Component: 5-Star Rating Renderer ────────────────────────────────────
interface StarRatingProps {
  score: number
  showValue?: boolean
}

function StarRatingDisplay({ score, showValue = true }: StarRatingProps) {
  const rounded = Math.round(score * 10) / 10
  const stars = []

  for (let i = 1; i <= 5; i++) {
    if (rounded >= i) {
      stars.push(
        <Star
          key={i}
          className="w-4 h-4 text-[#FFD700] fill-[#FFD700] inline-block"
          style={{ filter: 'drop-shadow(0px 1px 2px rgba(200, 150, 12, 0.4))' }}
        />
      )
    } else if (rounded >= i - 0.5) {
      stars.push(
        <StarHalf
          key={i}
          className="w-4 h-4 text-[#FFD700] fill-[#FFD700] inline-block"
          style={{ filter: 'drop-shadow(0px 1px 2px rgba(200, 150, 12, 0.4))' }}
        />
      )
    } else {
      stars.push(
        <Star
          key={i}
          className="w-4 h-4 text-gray-300 fill-gray-100 inline-block"
        />
      )
    }
  }

  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
      <Box sx={{ display: 'flex', gap: 0.25, alignItems: 'center' }}>{stars}</Box>
      {showValue && (
        <Typography
          component="span"
          sx={{
            fontSize: '12.5px',
            fontWeight: 700,
            color: '#1E293B',
            fontFamily: 'monospace',
            bgcolor: '#F1F5F9',
            px: 1,
            py: 0.25,
            borderRadius: '4px',
            border: '1px solid #E2E8F0',
          }}
        >
          {score.toFixed(1)} / 5.0
        </Typography>
      )}
    </Box>
  )
}

// ─── Main Component: Evaluation Period Page ──────────────────────────────────
export function SLAReviewPage() {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  // Filters & Sorting state
  const [periodFilter, setPeriodFilter] = useState<EvaluationPeriodType>('ALL_TIME')
  const [sortOption, setSortOption] = useState<ServiceSortOption>('DEFAULT')
  const [services, setServices] = useState<Service[]>([])

  // Fetch all system transactions & active services on load
  useEffect(() => {
    getTransactionsApi()
      .then(setTransactions)
      .finally(() => setLoading(false))

    getServicesApi()
      .then(setServices)
      .catch(() => setServices(MOCK_SERVICES))
  }, [])

  // Resolve user office code and role title
  const officeCode: OfficeCode | 'ALL' = useMemo(() => {
    if (user?.role === 'opcr_evaluator') return 'ALL'
    if (user?.office_code) return user.office_code
    return 'OSAS'
  }, [user])

  const userPositionTitle = useMemo(() => {
    if (user?.role === 'opcr_evaluator') return 'PUP OPCR EVALUATOR / DEPARTMENT HEAD'
    if (user?.office_code === 'OSAS') return 'OSAS ADMIN (STUDENT AFFAIRS)'
    if (user?.office_code === 'ACADEMIC_OFFICE') return 'ACAD ADMIN (ACADEMIC SERVICES)'
    if (user?.office_code === 'ADMIN_OFFICE') return 'ADMINISTRATIVE SERVICES ADMIN'
    return 'SUBSYSTEM ADMIN'
  }, [user])

  const currentDateFormatted = useMemo(() => {
    const d = new Date()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const year = d.getFullYear()
    return `${month}/${day}/${year}`
  }, [])

  // Calculate dynamic service performance metrics
  const [summaries, setSummaries] = useState<ServicePerformanceSummary[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const svcCatalog = services.length > 0 ? services : MOCK_SERVICES
    fetchServicePerformanceReview(
      officeCode,
      periodFilter,
      sortOption,
      svcCatalog,
      transactions
    ).then(setSummaries)
  }, [officeCode, periodFilter, sortOption, transactions, services])

  // Dynamically filter services by service name, timeliness, effectiveness, quality, or percentage
  const filteredSummaries = useMemo(() => {
    if (!searchQuery.trim()) return summaries
    const q = searchQuery.trim().toLowerCase()

    return summaries.filter((row) => {
      const nameMatch = row.serviceName.toLowerCase().includes(q)
      const catMatch = row.category.toLowerCase().includes(q)

      const timelinessStr = row.timelinessScore.toFixed(1)
      const timelinessRound = Math.round(row.timelinessScore).toString()
      const timelinessMatch = timelinessStr.includes(q) || timelinessRound === q

      const effectStr = row.effectivenessScore.toFixed(1)
      const effectRound = Math.round(row.effectivenessScore).toString()
      const effectMatch = effectStr.includes(q) || effectRound === q

      const qualityStr = row.qualityScore.toFixed(1)
      const qualityRound = Math.round(row.qualityScore).toString()
      const qualityMatch = qualityStr.includes(q) || qualityRound === q

      const pctStr = row.overallPercentage.toFixed(1)
      const pctRound = Math.round(row.overallPercentage).toString()
      const pctMatch =
        pctStr.includes(q) ||
        pctRound === q ||
        `${pctStr}%`.includes(q) ||
        `${pctRound}%`.includes(q)

      const breachedMatch = q.includes('breach') && row.breachedCount > 0

      return (
        nameMatch ||
        catMatch ||
        timelinessMatch ||
        effectMatch ||
        qualityMatch ||
        pctMatch ||
        breachedMatch
      )
    })
  }, [summaries, searchQuery])

  // Aggregate high-level statistics for current period
  const overallStats = useMemo(() => {
    if (summaries.length === 0) return { avgPercentage: 0, totalVolume: 0, compliantCount: 0, breachCount: 0 }
    const totalVolume = summaries.reduce((acc, s) => acc + s.totalVolume, 0)
    const compliantCount = summaries.reduce((acc, s) => acc + s.compliantCount, 0)
    const breachCount = summaries.reduce((acc, s) => acc + s.breachedCount, 0)

    const activeSvcs = summaries.filter((s) => s.totalVolume > 0)
    const avgPercentage = activeSvcs.length > 0
      ? Math.round((activeSvcs.reduce((acc, s) => acc + s.overallPercentage, 0) / activeSvcs.length) * 10) / 10
      : 0

    return { avgPercentage, totalVolume, compliantCount, breachCount }
  }, [summaries])

  const activePeriodRange = getPeriodDateRange(periodFilter)

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, flex: 1, overflow: 'hidden', bgcolor: COLOR_OFFWHITE }}>
      <TopBar />

      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          pt: '24px',
          pb: '60px',
          px: { xs: '16px', sm: '24px', md: '32px' },
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
          '&::-webkit-scrollbar': { width: '10px' },
          '&::-webkit-scrollbar-track': { bgcolor: '#F1F5F9' },
          '&::-webkit-scrollbar-thumb': { bgcolor: '#94A3B8', borderRadius: '5px', '&:hover': { bgcolor: COLOR_MAROON } },
        }}
      >
        {/* Page Title & Context Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography
                variant="h4"
                sx={{
                  fontFamily: "'DM Serif Display', Georgia, serif",
                  color: COLOR_MAROON_DARK,
                  fontWeight: 700,
                  fontSize: { xs: '22px', sm: '26px' },
                  letterSpacing: '-0.02em',
                }}
              >
                Admin Service Performance Review
              </Typography>
              <Chip
                label="Evaluation Period"
                size="small"
                sx={{
                  bgcolor: '#800000',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '11px',
                  borderRadius: '6px',
                  height: '24px',
                }}
              />
            </Box>
            <Typography variant="body2" sx={{ color: '#64748B', mt: 0.5, fontSize: '13px' }}>
              Dynamic SLA performance analytics, star ratings, and compliance computing strictly bound to active evaluation timeframes.
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              icon={<Building2 className="w-3.5 h-3.5 text-[#800000]" />}
              label={`Subsystem Scope: ${user?.office_name || 'All Departments'}`}
              variant="outlined"
              sx={{
                borderColor: 'rgba(128, 0, 0, 0.3)',
                bgcolor: '#FFFFFF',
                color: COLOR_MAROON,
                fontWeight: 600,
                fontSize: '12px',
                py: 0.5,
              }}
            />
          </Box>
        </Box>

        {/* ─────────────────────────────────────────────────────────────
            SECTION A. Evaluator Metadata Header (Top Panel) — Expanded & High Visibility
        ───────────────────────────────────────────────────────────── */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: '14px',
            overflow: 'hidden',
            border: '1.5px solid #CBD5E1',
            boxShadow: '0 6px 20px rgba(0, 0, 0, 0.06)',
            background: '#FFFFFF',
          }}
        >
          {/* Header Maroon Band — Large & Prominent */}
          <Box
            sx={{
              background: `linear-gradient(135deg, ${COLOR_MAROON_DARK} 0%, ${COLOR_MAROON} 100%)`,
              color: '#FFFFFF',
              px: { xs: 2.5, sm: 3.5 },
              py: 2.5,
              display: 'flex',
              alignItems: 'center',
              justify: 'space-between',
              flexWrap: 'wrap',
              gap: 2,
              borderBottom: `4px solid ${COLOR_GOLD}`,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ p: 1, borderRadius: '10px', bgcolor: 'rgba(255, 215, 0, 0.15)', display: 'flex' }}>
                <ShieldCheck className="w-7 h-7 text-[#FFD700]" />
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 800, fontSize: { xs: '16px', sm: '19px' }, letterSpacing: '0.03em', textTransform: 'uppercase', color: '#FFFFFF' }}>
                  Evaluator Performance Review Header
                </Typography>
                <Typography sx={{ fontSize: '12.5px', color: 'rgba(255,255,255,0.85)', fontWeight: 500, mt: 0.25 }}>
                  PUP Caloocan Office Performance Commitment and Review (OPCR) Official Document
                </Typography>
              </Box>
            </Box>

            <Chip
              icon={<Award className="w-4 h-4 text-[#FFD700]" />}
              label="OFFICIAL EMS EVALUATION RECORD"
              sx={{
                bgcolor: 'rgba(255, 215, 0, 0.15)',
                color: '#FFD700',
                border: '1px solid #FFD700',
                fontWeight: 800,
                fontSize: '12.5px',
                fontFamily: 'monospace',
                px: 1.5,
                py: 2,
                borderRadius: '8px',
                letterSpacing: '0.05em',
              }}
            />
          </Box>

          {/* Metadata Grid — Clear, Large & Fully Visible */}
          <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
            <Grid container spacing={3}>
              {/* 1. Reviewer Name */}
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, p: 2.5, borderRadius: '10px', bgcolor: '#F8FAFC', border: '1px solid #E2E8F0', height: '100%' }}>
                  <Box sx={{ p: 1.5, borderRadius: '10px', bgcolor: 'rgba(128, 0, 0, 0.08)', color: COLOR_MAROON, flexShrink: 0 }}>
                    <UserCheck className="w-6 h-6" />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontSize: '11.5px', textTransform: 'uppercase', fontWeight: 800, color: '#64748B', letterSpacing: '0.06em' }}>
                      Reviewer Full Name
                    </Typography>
                    <Typography sx={{ fontSize: '17px', fontWeight: 800, color: '#0F172A', mt: 0.5, wordBreak: 'break-word' }}>
                      {user?.name || 'System Evaluator'}
                    </Typography>
                    <Typography sx={{ fontSize: '12px', color: '#64748B', mt: 0.25 }}>
                      ID: {user?.id || 'EMP-2026-001'}
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              {/* 2. Reviewer Position */}
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, p: 2.5, borderRadius: '10px', bgcolor: '#F8FAFC', border: '1px solid #E2E8F0', height: '100%' }}>
                  <Box sx={{ p: 1.5, borderRadius: '10px', bgcolor: 'rgba(200, 150, 12, 0.15)', color: COLOR_GOLD_DARK, flexShrink: 0 }}>
                    <Award className="w-6 h-6" />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontSize: '11.5px', textTransform: 'uppercase', fontWeight: 800, color: '#64748B', letterSpacing: '0.06em' }}>
                      Reviewer Position / Role
                    </Typography>
                    <Typography sx={{ fontSize: '15px', fontWeight: 800, color: COLOR_MAROON, mt: 0.5, lineHeight: 1.3 }}>
                      {userPositionTitle}
                    </Typography>
                    <Typography sx={{ fontSize: '12px', color: '#64748B', mt: 0.25 }}>
                      Access: {user?.role === 'opcr_evaluator' ? 'OPCR Evaluator' : 'Subsystem Admin'}
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              {/* 3. Department Scope */}
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, p: 2.5, borderRadius: '10px', bgcolor: '#F8FAFC', border: '1px solid #E2E8F0', height: '100%' }}>
                  <Box sx={{ p: 1.5, borderRadius: '10px', bgcolor: 'rgba(59, 130, 246, 0.1)', color: '#2563EB', flexShrink: 0 }}>
                    <Building2 className="w-6 h-6" />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontSize: '11.5px', textTransform: 'uppercase', fontWeight: 800, color: '#64748B', letterSpacing: '0.06em' }}>
                      Assigned Office Scope
                    </Typography>
                    <Typography sx={{ fontSize: '15.5px', fontWeight: 800, color: '#0F172A', mt: 0.5, lineHeight: 1.3 }}>
                      {user?.office_name || 'All PUP Offices'}
                    </Typography>
                    <Typography sx={{ fontSize: '12px', color: '#64748B', mt: 0.25 }}>
                      Code: {user?.office_code || 'ALL_OFFICES'}
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              {/* 4. Date of Review */}
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, p: 2.5, borderRadius: '10px', bgcolor: '#F8FAFC', border: '1px solid #E2E8F0', height: '100%' }}>
                  <Box sx={{ p: 1.5, borderRadius: '10px', bgcolor: 'rgba(30, 41, 59, 0.1)', color: '#1E293B', flexShrink: 0 }}>
                    <Calendar className="w-6 h-6" />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontSize: '11.5px', textTransform: 'uppercase', fontWeight: 800, color: '#64748B', letterSpacing: '0.06em' }}>
                      Date of Review
                    </Typography>
                    <Typography sx={{ fontSize: '17px', fontWeight: 800, color: '#0F172A', mt: 0.5, fontFamily: 'monospace' }}>
                      {currentDateFormatted}
                    </Typography>
                    <Typography sx={{ fontSize: '12px', color: '#166534', fontWeight: 600, mt: 0.25 }}>
                      Status: Active Evaluation
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Paper>

        {/* ─────────────────────────────────────────────────────────────
            SECTION B. Dynamic Controls Bar (Filters & Sorting)
        ───────────────────────────────────────────────────────────── */}
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            borderRadius: '12px',
            border: '1px solid #E2E8F0',
            bgcolor: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justify: 'space-between',
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            {/* Filter Label */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: COLOR_MAROON }}>
              <SlidersHorizontal className="w-4 h-4" />
              <Typography sx={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Controls:
              </Typography>
            </Box>

            {/* 1. Service Search Bar (Right after CONTROLS: label) */}
            <FormControl size="small" sx={{ minWidth: 320, flex: 1 }}>
              <Typography variant="caption" sx={{ fontSize: '10.5px', fontWeight: 700, color: '#64748B', mb: 0.5, display: 'block' }}>
                1. SEARCH SERVICE / RATING / %
              </Typography>
              <TextField
                size="small"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search style={{ width: 16, height: 16, color: '#64748B' }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <Button
                          variant="contained"
                          size="small"
                          sx={{
                            bgcolor: COLOR_MAROON,
                            color: '#FFFFFF',
                            fontWeight: 700,
                            fontSize: '11.5px',
                            height: '28px',
                            px: 1.5,
                            borderRadius: '6px',
                            textTransform: 'none',
                            boxShadow: 'none',
                            '&:hover': { bgcolor: COLOR_MAROON_DARK },
                          }}
                        >
                          Search
                        </Button>
                      </InputAdornment>
                    ),
                  },
                }}
                sx={{
                  borderRadius: '8px',
                  fontSize: '13px',
                  bgcolor: '#F8FAFC',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#CBD5E1' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: COLOR_MAROON },
                  '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: COLOR_MAROON },
                }}
              />
            </FormControl>

            {/* 2. Time Period Filter */}
            <FormControl size="small" sx={{ minWidth: 220 }}>
              <Typography variant="caption" sx={{ fontSize: '10.5px', fontWeight: 700, color: '#64748B', mb: 0.5, display: 'block' }}>
                2. TIME PERIOD FILTER
              </Typography>
              <Select
                value={periodFilter}
                onChange={(e) => setPeriodFilter(e.target.value as EvaluationPeriodType)}
                sx={{
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  bgcolor: '#F8FAFC',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#CBD5E1' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: COLOR_MAROON },
                }}
              >
                <MenuItem value="ALL_TIME">All Time (All Transactions)</MenuItem>
                <MenuItem value="SEM_2">Semester: Sem 2 (Feb 1–Jul 31)</MenuItem>
                <MenuItem value="SEM_1">Semester: Sem 1 (Aug 1–Jan 31)</MenuItem>
                <MenuItem value="Q1">Quarterly: Q1 (Jan–Mar)</MenuItem>
                <MenuItem value="Q2">Quarterly: Q2 (Apr–Jun)</MenuItem>
                <MenuItem value="Q3">Quarterly: Q3 (Jul–Sep)</MenuItem>
                <MenuItem value="Q4">Quarterly: Q4 (Oct–Dec)</MenuItem>
                <MenuItem value="ANNUAL">Annual: Full Year (Jan 1–Dec 31)</MenuItem>
              </Select>
            </FormControl>

            {/* 3. Service Sorting Dropdown */}
            <FormControl size="small" sx={{ minWidth: 240 }}>
              <Typography variant="caption" sx={{ fontSize: '10.5px', fontWeight: 700, color: '#64748B', mb: 0.5, display: 'block' }}>
                3. SERVICE SORTING ORDER
              </Typography>
              <Select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as ServiceSortOption)}
                sx={{
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  bgcolor: '#F8FAFC',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#CBD5E1' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: COLOR_MAROON },
                }}
              >
                <MenuItem value="DEFAULT">Default / Citizen's Charter Order</MenuItem>
                <MenuItem value="RATING_DESC">Highest Overall Rating</MenuItem>
                <MenuItem value="RATING_ASC">Lowest Overall Rating</MenuItem>
                <MenuItem value="ALPHA_ASC">Alphabetical (A to Z)</MenuItem>
                <MenuItem value="ALPHA_DESC">Alphabetical (Z to A)</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* Active Period Date Bounds Display */}
          <Box sx={{ textAlign: { xs: 'left', sm: 'right' }, px: 1 }}>
            <Typography variant="caption" sx={{ color: '#64748B', fontSize: '11px', display: 'block', fontWeight: 600 }}>
              Active Evaluation Scope Window:
            </Typography>
            <Typography sx={{ fontSize: '12.5px', fontWeight: 700, color: COLOR_MAROON, fontFamily: 'monospace' }}>
              {activePeriodRange.sublabel}
            </Typography>
          </Box>
        </Paper>

        {/* ─────────────────────────────────────────────────────────────
            SECTION C. Summary KPI Cards
        ───────────────────────────────────────────────────────────── */}
        <Grid container spacing={2.5}>
          {/* Average Compliance Score */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card
              sx={{
                bgcolor: '#FFFFFF',
                borderRadius: '10px',
                borderTop: `4px solid ${COLOR_MAROON}`,
                borderLeft: '1px solid #E2E8F0',
                borderRight: '1px solid #E2E8F0',
                borderBottom: '1px solid #E2E8F0',
                boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
                p: 2.25,
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography sx={{ fontSize: '12px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                    Overall Rating Score
                  </Typography>
                  <Typography sx={{ fontSize: '26px', fontWeight: 800, color: COLOR_MAROON, mt: 0.5 }}>
                    {overallStats.avgPercentage}%
                  </Typography>
                </Box>
                <Box sx={{ p: 1.2, borderRadius: '8px', bgcolor: 'rgba(128,0,0,0.08)', color: COLOR_MAROON }}>
                  <Award className="w-5 h-5" />
                </Box>
              </Box>
              <Typography sx={{ fontSize: '11.5px', color: '#64748B', mt: 1 }}>
                Weighted average across catalog
              </Typography>
            </Card>
          </Grid>

          {/* Evaluated Services Count */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card
              sx={{
                bgcolor: '#FFFFFF',
                borderRadius: '10px',
                borderTop: `4px solid ${COLOR_GOLD_DARK}`,
                borderLeft: '1px solid #E2E8F0',
                borderRight: '1px solid #E2E8F0',
                borderBottom: '1px solid #E2E8F0',
                boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
                p: 2.25,
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography sx={{ fontSize: '12px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                    Active Services
                  </Typography>
                  <Typography sx={{ fontSize: '26px', fontWeight: 800, color: COLOR_GOLD_DARK, mt: 0.5 }}>
                    {summaries.length}
                  </Typography>
                </Box>
                <Box sx={{ p: 1.2, borderRadius: '8px', bgcolor: 'rgba(200,150,12,0.1)', color: COLOR_GOLD_DARK }}>
                  <FileSpreadsheet className="w-5 h-5" />
                </Box>
              </Box>
              <Typography sx={{ fontSize: '11.5px', color: '#64748B', mt: 1 }}>
                Catalog items in selected office
              </Typography>
            </Card>
          </Grid>

          {/* Total Transactions Filtered */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card
              sx={{
                bgcolor: '#FFFFFF',
                borderRadius: '10px',
                borderTop: '4px solid #1D9E75',
                borderLeft: '1px solid #E2E8F0',
                borderRight: '1px solid #E2E8F0',
                borderBottom: '1px solid #E2E8F0',
                boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
                p: 2.25,
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography sx={{ fontSize: '12px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                    Completed Volume
                  </Typography>
                  <Typography sx={{ fontSize: '26px', fontWeight: 800, color: '#1D9E75', mt: 0.5 }}>
                    {overallStats.totalVolume}
                  </Typography>
                </Box>
                <Box sx={{ p: 1.2, borderRadius: '8px', bgcolor: 'rgba(29,158,117,0.08)', color: '#1D9E75' }}>
                  <CheckCircle2 className="w-5 h-5" />
                </Box>
              </Box>
              <Typography sx={{ fontSize: '11.5px', color: '#64748B', mt: 1 }}>
                Strictly within period scope window
              </Typography>
            </Card>
          </Grid>

          {/* Compliant Count */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card
              sx={{
                bgcolor: '#FFFFFF',
                borderRadius: '10px',
                borderTop: '4px solid #3B82F6',
                borderLeft: '1px solid #E2E8F0',
                borderRight: '1px solid #E2E8F0',
                borderBottom: '1px solid #E2E8F0',
                boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
                p: 2.25,
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography sx={{ fontSize: '12px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                    Compliant vs Breached
                  </Typography>
                  <Typography sx={{ fontSize: '26px', fontWeight: 800, color: '#1E293B', mt: 0.5 }}>
                    {overallStats.compliantCount} <span style={{ fontSize: '16px', color: '#94A3B8' }}>/ {overallStats.breachCount}</span>
                  </Typography>
                </Box>
                <Box sx={{ p: 1.2, borderRadius: '8px', bgcolor: 'rgba(59,130,246,0.08)', color: '#3B82F6' }}>
                  <BarChart3 className="w-5 h-5" />
                </Box>
              </Box>
              <Typography sx={{ fontSize: '11.5px', color: '#64748B', mt: 1 }}>
                SLA compliance ratio
              </Typography>
            </Card>
          </Grid>
        </Grid>

        {/* ─────────────────────────────────────────────────────────────
            SECTION D. Evaluation Performance Table
        ───────────────────────────────────────────────────────────── */}
        <Paper
          elevation={0}
          sx={{
            borderRadius: '12px',
            border: '1px solid #E2E8F0',
            overflow: 'visible',
            boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
            bgcolor: '#FFFFFF',
          }}
        >
          {/* Table Banner */}
          <Box
            sx={{
              px: 3,
              py: 2,
              bgcolor: '#FFFFFF',
              borderBottom: '1px solid #E2E8F0',
              borderTopLeftRadius: '12px',
              borderTopRightRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Typography sx={{ fontWeight: 700, fontSize: '15px', color: COLOR_MAROON_DARK, letterSpacing: '-0.01em' }}>
              Service SLA Performance Ratings
            </Typography>
            <Typography sx={{ fontSize: '12px', color: '#64748B', fontWeight: 500 }}>
              Showing {filteredSummaries.length} of {summaries.length} services • Sorted by {sortOption.replace('_', ' ')}
            </Typography>
          </Box>

          <TableContainer
            sx={{
              overflowY: 'visible',
              borderTop: '1px solid #E2E8F0',
              width: '100%',
            }}
          >
            <Table sx={{ minWidth: 800 }}>
              {/* Header Band: PUP Maroon (#800000) with Bold White Text & Sticky Positioning */}
              <TableHead>
                <TableRow>
                  <TableCell
                    sx={{
                      bgcolor: COLOR_MAROON,
                      color: '#FFFFFF',
                      fontWeight: 800,
                      fontSize: '14px',
                      py: 2.25,
                      width: '38%',
                      position: 'sticky',
                      top: 0,
                      zIndex: 10,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    }}
                  >
                    SERVICES
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{
                      bgcolor: COLOR_MAROON,
                      color: '#FFFFFF',
                      fontWeight: 800,
                      fontSize: '14px',
                      py: 2.25,
                      width: '18%',
                      position: 'sticky',
                      top: 0,
                      zIndex: 10,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    }}
                  >
                    TIMELINESS
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{
                      bgcolor: COLOR_MAROON,
                      color: '#FFFFFF',
                      fontWeight: 800,
                      fontSize: '14px',
                      py: 2.25,
                      width: '18%',
                      position: 'sticky',
                      top: 0,
                      zIndex: 10,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    }}
                  >
                    EFFECTIVENESS
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{
                      bgcolor: COLOR_MAROON,
                      color: '#FFFFFF',
                      fontWeight: 800,
                      fontSize: '14px',
                      py: 2.25,
                      width: '16%',
                      position: 'sticky',
                      top: 0,
                      zIndex: 10,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    }}
                  >
                    QUALITY
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{
                      bgcolor: COLOR_MAROON,
                      color: '#FFFFFF',
                      fontWeight: 800,
                      fontSize: '14px',
                      py: 2.25,
                      width: '10%',
                      position: 'sticky',
                      top: 0,
                      zIndex: 10,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    }}
                  >
                    PERCENTAGE
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                      <Typography sx={{ color: '#64748B', fontSize: '15px' }}>Loading evaluation period performance data...</Typography>
                    </TableCell>
                  </TableRow>
                ) : summaries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                      <Typography sx={{ color: '#64748B', fontSize: '15px' }}>
                        No active service catalogue found for this office.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : filteredSummaries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                      <Typography sx={{ color: '#64748B', fontSize: '15px' }}>
                        No services matched your search query "{searchQuery}".
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSummaries.map((row, idx) => {
                    const isEven = idx % 2 === 0
                    return (
                      <TableRow
                        key={row.serviceId}
                        sx={{
                          bgcolor: isEven ? '#FFFFFF' : '#F9FAFB',
                          transition: 'background-color 0.15s ease',
                          '&:hover': { bgcolor: 'rgba(128, 0, 0, 0.04)' },
                        }}
                      >
                        {/* SERVICE NAME & METADATA */}
                        <TableCell sx={{ py: 2.25, px: 3 }}>
                          <Typography sx={{ fontWeight: 800, fontSize: '14.5px', color: '#0F172A', lineHeight: 1.3 }}>
                            {row.serviceName}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 0.75, flexWrap: 'wrap' }}>
                            <Chip
                              label={row.category}
                              size="small"
                              sx={{
                                height: '22px',
                                fontSize: '11px',
                                fontWeight: 700,
                                bgcolor: '#F1F5F9',
                                color: '#334155',
                                borderRadius: '4px',
                              }}
                            />
                            <Typography sx={{ fontSize: '12px', color: '#64748B' }}>
                              Volume: <strong style={{ color: '#0F172A' }}>{row.totalVolume}</strong> completed
                            </Typography>
                            <Typography sx={{ fontSize: '12px', color: '#64748B' }}>
                              Target SLA: <strong style={{ color: '#0F172A' }}>{row.slaTargetMinutes}m</strong>
                            </Typography>
                            {row.breachedCount > 0 && (
                              <Chip
                                label={`${row.breachedCount} breached`}
                                size="small"
                                sx={{
                                  height: '20px',
                                  fontSize: '10.5px',
                                  fontWeight: 700,
                                  bgcolor: '#FEF2F2',
                                  color: '#DC2626',
                                  border: '1px solid #FECACA',
                                }}
                              />
                            )}
                          </Box>
                        </TableCell>

                        {/* TIMELINESS RATING */}
                        <TableCell align="center" sx={{ py: 2.25 }}>
                          <Tooltip title={row.totalVolume > 0 ? `Avg Net Working Duration: ${row.avgWorkingMinutes}m vs ${row.slaTargetMinutes}m SLA target` : 'Baseline Rating (100% compliant / 0 breaches)'} arrow>
                            <Box sx={{ display: 'inline-block' }}>
                              <StarRatingDisplay score={row.timelinessScore} />
                            </Box>
                          </Tooltip>
                        </TableCell>

                        {/* EFFECTIVENESS RATING */}
                        <TableCell align="center" sx={{ py: 2.25 }}>
                          <Tooltip title={row.totalVolume > 0 ? `${row.compliantCount} non-breached out of ${row.totalVolume} total completed` : 'Baseline Rating (100% compliant / 0 breaches)'} arrow>
                            <Box sx={{ display: 'inline-block' }}>
                              <StarRatingDisplay score={row.effectivenessScore} />
                            </Box>
                          </Tooltip>
                        </TableCell>

                        {/* QUALITY RATING */}
                        <TableCell align="center" sx={{ py: 2.25 }}>
                          <Tooltip title="Service Accuracy & Compliance Score" arrow>
                            <Box sx={{ display: 'inline-block' }}>
                              <StarRatingDisplay score={row.qualityScore} />
                            </Box>
                          </Tooltip>
                        </TableCell>

                        {/* OVERALL PERCENTAGE */}
                        <TableCell align="center" sx={{ py: 2.25 }}>
                          <Chip
                            label={`${row.overallPercentage.toFixed(1)}%`}
                            sx={{
                              fontWeight: 800,
                              fontSize: '13.5px',
                              fontFamily: 'monospace',
                              px: 1,
                              py: 0.5,
                              bgcolor:
                                row.overallPercentage >= 85
                                  ? '#ECFDF5'
                                  : row.overallPercentage >= 70
                                  ? '#FFFBEB'
                                  : '#FEF2F2',
                              color:
                                row.overallPercentage >= 85
                                  ? '#047857'
                                  : row.overallPercentage >= 70
                                  ? '#B45309'
                                  : '#B91C1C',
                              border: `1px solid ${
                                row.overallPercentage >= 85
                                  ? '#A7F3D0'
                                  : row.overallPercentage >= 70
                                  ? '#FDE68A'
                                  : '#FECACA'
                              }`,
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    </Box>
  )
}
