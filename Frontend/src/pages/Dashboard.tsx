import { Link } from 'react-router-dom'
import { Home, ArrowRight } from 'lucide-react'
import AppShell from '../components/layout/app-shell'
import { useAuth } from '../context/AuthContext'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const ROLE_LABEL: Record<string, string> = {
  SEEKER: 'Seeker',
  FLAT_POSTER: 'Flat Poster',
  ADMIN: 'Admin'
}

export default function Dashboard() {
  const { user } = useAuth()

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Welcome back, {user?.name}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Here's what's happening with your account.
            </p>
          </div>
          <Badge variant="secondary">{ROLE_LABEL[user?.role ?? ''] ?? user?.role}</Badge>
        </div>

        <Card>
          <CardHeader>
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-secondary">
              <Home className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
            </div>
            <CardTitle className="mt-3">Listings feed is on its way</CardTitle>
            <CardDescription>
              Browsing and posting flats/roommates will appear here once the listings
              feature ships. In the meantime, make sure your profile is filled in so
              you're ready to go the moment it's live.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link to="/profile">
                Complete your profile
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
