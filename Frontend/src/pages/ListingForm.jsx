import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import AppShell from '../components/layout/app-shell'
import { useAuth } from '../context/AuthContext'
import { createListing, updateListing, getListing } from '../api/listings'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert } from '@/components/ui/alert'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '@/components/ui/select'

const emptyForm = {
  type: 'FLAT_AVAILABLE',
  location: '',
  rentMin: '',
  rentMax: '',
  availableFrom: '',
  amenities: '',
  genderPreference: 'CO_ED'
}

export default function ListingForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const { user } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isEdit) return
    getListing(id)
      .then((res) => {
        if (res.success) {
          const l = res.data
          if (l.postedByUserId !== user.id) {
            setError('You can only edit your own listings.')
            return
          }
          setForm({
            type: l.type,
            location: l.location,
            rentMin: l.rentMin ?? '',
            rentMax: l.rentMax ?? '',
            availableFrom: l.availableFrom ?? '',
            amenities: l.amenities ?? '',
            genderPreference: l.genderPreference
          })
        }
      })
      .catch(() => setError('Could not load this listing.'))
      .finally(() => setLoading(false))
  }, [id, isEdit, user.id])

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const payload = {
        ...form,
        rentMin: form.rentMin ? Number(form.rentMin) : null,
        rentMax: form.rentMax ? Number(form.rentMax) : null,
        availableFrom: form.availableFrom || null
      }
      const res = isEdit
        ? await updateListing(id, user.id, payload)
        : await createListing(user.id, payload)

      if (!res.success) {
        setError(res.message)
        return
      }
      navigate(`/listings/${res.data.id}`)
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <AppShell>
        <p className="text-sm text-muted-foreground">Loading...</p>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-lg">
        <Card>
          <CardHeader>
            <CardTitle>{isEdit ? 'Edit listing' : 'New listing'}</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4">
                <Alert variant="destructive">{error}</Alert>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="type">Listing type</Label>
                <Select value={form.type} onValueChange={(v) => updateField('type', v)}>
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FLAT_AVAILABLE">
                      I have a flat, looking for a roommate
                    </SelectItem>
                    <SelectItem value="LOOKING_FOR_FLAT">
                      I'm looking for a flat and roommate
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  required
                  placeholder="e.g. Koramangala 5th Block"
                  value={form.location}
                  onChange={(e) => updateField('location', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="rentMin">Min rent (₹)</Label>
                  <Input
                    id="rentMin"
                    type="number"
                    min="0"
                    value={form.rentMin}
                    onChange={(e) => updateField('rentMin', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="rentMax">Max rent (₹)</Label>
                  <Input
                    id="rentMax"
                    type="number"
                    min="0"
                    value={form.rentMax}
                    onChange={(e) => updateField('rentMax', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="availableFrom">Available from</Label>
                <Input
                  id="availableFrom"
                  type="date"
                  value={form.availableFrom}
                  onChange={(e) => updateField('availableFrom', e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="amenities">Amenities</Label>
                <Input
                  id="amenities"
                  placeholder="e.g. wifi, furnished, parking"
                  value={form.amenities}
                  onChange={(e) => updateField('amenities', e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="genderPreference">Gender preference</Label>
                <Select
                  value={form.genderPreference}
                  onValueChange={(v) => updateField('genderPreference', v)}
                >
                  <SelectTrigger id="genderPreference">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE_ONLY">Male only</SelectItem>
                    <SelectItem value="FEMALE_ONLY">Female only</SelectItem>
                    <SelectItem value="CO_ED">Co-ed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" className="w-full" isLoading={saving}>
                {isEdit ? 'Save changes' : 'Post listing'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
