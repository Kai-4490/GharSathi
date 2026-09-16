import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, MapPin, Search } from 'lucide-react'
import AppShell from '../components/layout/app-shell'
import { searchListings } from '../api/listings'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert } from '@/components/ui/alert'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '@/components/ui/select'

const GENDER_LABEL = {
  MALE_ONLY: 'Male only',
  FEMALE_ONLY: 'Female only',
  CO_ED: 'Co-ed'
}

const TYPE_LABEL = {
  FLAT_AVAILABLE: 'Flat available',
  LOOKING_FOR_FLAT: 'Looking for flat'
}

export default function Listings() {
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [location, setLocation] = useState('')
  const [maxBudget, setMaxBudget] = useState('')
  const [genderPreference, setGenderPreference] = useState('')

  function runSearch(filters = {}) {
    setLoading(true)
    setError('')
    searchListings(filters)
      .then((res) => {
        if (res.success) {
          setListings(res.data)
        } else {
          setError(res.message)
        }
      })
      .catch((err) => {
        const status = err.response?.status
        const backendMessage = err.response?.data?.message
        if (backendMessage) {
          setError(backendMessage)
        } else if (status) {
          setError(`Request failed (${status}). ${status === 401 || status === 403 ? 'Try logging in again.' : ''}`)
        } else {
          setError('Could not reach the server. Is the backend running on localhost:8080?')
        }
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    runSearch()
  }, [])

  function handleSearch(e) {
    e.preventDefault()
    runSearch({
      location: location || undefined,
      maxBudget: maxBudget || undefined,
      genderPreference: genderPreference || undefined
    })
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Listings</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Browse flats and roommate posts.
            </p>
          </div>
          <Button asChild>
            <Link to="/listings/new">
              <Plus className="h-4 w-4" aria-hidden="true" />
              New listing
            </Link>
          </Button>
        </div>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSearch} className="flex flex-wrap items-end gap-3">
              <div className="min-w-[180px] flex-1">
                <label className="mb-1.5 block text-sm font-medium text-muted-foreground">
                  Location
                </label>
                <Input
                  placeholder="e.g. Koramangala"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
              <div className="w-36">
                <label className="mb-1.5 block text-sm font-medium text-muted-foreground">
                  Max budget
                </label>
                <Input
                  type="number"
                  placeholder="15000"
                  value={maxBudget}
                  onChange={(e) => setMaxBudget(e.target.value)}
                />
              </div>
              <div className="w-44">
                <label className="mb-1.5 block text-sm font-medium text-muted-foreground">
                  Gender preference
                </label>
                <Select value={genderPreference} onValueChange={setGenderPreference}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE_ONLY">Male only</SelectItem>
                    <SelectItem value="FEMALE_ONLY">Female only</SelectItem>
                    <SelectItem value="CO_ED">Co-ed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" variant="outline">
                <Search className="h-4 w-4" aria-hidden="true" />
                Search
              </Button>
            </form>
          </CardContent>
        </Card>

        {error && <Alert variant="destructive">{error}</Alert>}

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-36" />
            ))}
          </div>
        ) : listings.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              No listings match your search yet.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {listings.map((listing) => (
              <Link key={listing.id} to={`/listings/${listing.id}`}>
                <Card className="h-full transition-colors hover:border-primary/50">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base">{listing.location}</CardTitle>
                      <Badge variant="secondary">{TYPE_LABEL[listing.type]}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 pt-0">
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                      {listing.postedByName}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">
                        {listing.rentMin && listing.rentMax
                          ? `₹${listing.rentMin} - ₹${listing.rentMax}`
                          : 'Budget not specified'}
                      </span>
                      <Badge variant="outline">{GENDER_LABEL[listing.genderPreference]}</Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
