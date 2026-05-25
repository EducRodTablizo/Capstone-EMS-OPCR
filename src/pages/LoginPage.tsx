import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'
import { useAuth } from '@/auth/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

const DEMO_ACCOUNTS = [
  { email: 'admin@ems.ph', password: 'admin123', role: 'Subsystem Admin (Admin Office)' },
  { email: 'staff@ems.ph', password: 'staff123', role: 'Staff (Admin Office)' },
  { email: 'opcr@ems.ph', password: 'opcr123', role: 'OPCR Evaluator' },
  { email: 'ebautista@pup.edu.ph', password: 'admin123', role: 'Subsystem Admin (OSAS)' },
]

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login({ email, password })
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  function quickLogin(acc: { email: string; password: string }) {
    setEmail(acc.email)
    setPassword(acc.password)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white border-4 border-primary/20 shadow-md mb-4">
            <img
              src="https://grazia-prod.oss-ap-southeast-1.aliyuncs.com/resources/uid_100017370/757bc6c1-305f-4e.png"
              alt="PUP Logo"
              className="w-16 h-16 object-contain"
              crossOrigin="anonymous"
            />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Evaluation &</h1>
          <h1 className="text-2xl font-bold text-foreground">Monitoring System</h1>
          <p className="text-sm text-muted-foreground mt-1">PUP Caloocan — OPCR Compliance Platform</p>
        </div>

        {/* Login Card */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Sign in to your account</CardTitle>
            <CardDescription className="text-xs">
              Credentials are validated via the Administrative &amp; Records Management System (ARMS)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@pup.edu.ph"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPw ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2">
                  <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                  <p className="text-xs text-destructive">{error}</p>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
                    Authenticating…
                  </span>
                ) : 'Sign in'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Demo accounts */}
        <Card className="border-dashed">
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
              Demo Accounts
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="space-y-1.5">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => quickLogin(acc)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-md text-left hover:bg-accent transition-colors group"
                >
                  <div>
                    <p className="text-xs font-medium text-foreground">{acc.role}</p>
                    <p className="text-[11px] text-muted-foreground">{acc.email}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground group-hover:text-primary transition-colors">
                    Use →
                  </span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
