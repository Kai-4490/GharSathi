import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Pencil, EyeOff, Trash2, MapPin, Calendar, Wallet } from 'lucide-react'
import AppShell from '../components/layout/app-shell'
import { useAuth } from '../context/AuthContext'
import { getListing, deactivateListing, deleteListing } from '../api/listings'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'

const GENDER_LABEL = {
  MALE_ONLY: 'Male only',
  FEMALE_ONLY: 'Female only',
  CO_ED: 'Co-ed'
}

const TYPE_LABEL = {
  FLAT_AVAILABLE: 'Flat available',
  LOOKING_FOR_FLAT: 'Looking for flat'
}

const STATUS_VARIANT = {
  ACTIVE: 'success',
  INACTIVE: 'secondary',
  DELETED: 'destructive'
}

export default function ListingDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [listing, setListing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')

  useEffect(() => {
    getListing(id)
      .then((res) => {
        if (res.success) {
          setListing(res.data)
        } else {
          setError(res.message)
        }
      })
      .catch(() => setError('Could not load this listing.'))
      .finally(() => setLoading(false))
  }, [id])

  const isOwner = listing && user && listing.postedByUserId === user.id

  async function handleDeactivate() {
    setActionError('')
    try {
      const res = await deactivateListing(id, user.id)
      if (!res.success) {
        setActionError(res.message)
        return
      }
      setListing((prev) => ({ ...prev, status: 'INACTIVE' }))
    } catch (err) {
      setActionError(err.response?.data?.message || 'Something went wrong.')
    }
  }

  async function handleDelete() {
    if (!window.confirm('Delete this listing? This cannot be undone.')) return
    setActionError('')
    try {
      const res = await deleteListing(id, user.id)
      if (!res.success) {
        setActionError(res.message)
        return
      }
      navigate('/listings')
    } catch (err) {
      setActionError(err.response?.data?.message || 'Something went wrong.')
    }
  }

  if (loading) {
    return (
      <AppShell>
        <p className="text-sm text-muted-foreground">Loading...</p>
      </AppShell>
    )
  }

  if (error) {
    return (
      <AppShell>
        <Alert variant="destructive">{error}</Alert>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-2">
              <div>
                <CardTitle>{listing.location}</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Posted by {listing.postedByName}
                </p>
              </div>
              <div className="flex gap-2">
                <Badge variant={STATUS_VARIANT[listing.status]}>{listing.status}</Badge>
                <Badge variant="secondary">{TYPE_LABEL[listing.type]}</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {actionError && <Alert variant="destructive">{actionError}</Alert>}

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-2 text-sm">
                <Wallet className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                {listing.rentMin && listing.rentMax
                  ? `₹${listing.rentMin} - ₹${listing.rentMax}`
                  : 'Budget not specified'}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                {GENDER_LABEL[listing.genderPreference]}
              </div>
              {listing.availableFrom && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  Available from {listing.availableFrom}
                </div>
              )}
            </div>

            {listing.amenities && (
              <>
                <Separator />
                <div>
                  <p className="mb-1 text-sm font-medium text-foreground">Amenities</p>
                  <p className="text-sm text-muted-foreground">{listing.amenities}</p>
                </div>
              </>
            )}

            {isOwner && listing.status !== 'DELETED' && (
              <>
                <Separator />
                <div className="flex flex-wrap gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link to={`/listings/${id}/edit`}>
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                      Edit
                    </Link>
                  </Button>
                  {listing.status === 'ACTIVE' && (
                    <Button variant="outline" size="sm" onClick={handleDeactivate}>
                      <EyeOff className="h-4 w-4" aria-hidden="true" />
                      Deactivate
                    </Button>
                  )}
                  <Button variant="destructive" size="sm" onClick={handleDelete}>
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    Delete
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
