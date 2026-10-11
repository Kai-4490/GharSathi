import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import * as listingsApi from '../api/listings'
import { toastError } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { AMENITY_SUGGESTIONS, GENDER_LABEL, GENDER_PREFERENCES, LISTING_TYPES, LISTING_TYPE_LABEL } from '../constants/enums'
import { splitList } from '../utils/match'
import { toDateInput } from '../utils/dates'
import { numOrNull } from '../utils/normalize'
import ChipInput from '../components/ChipInput'
import Spinner from '../components/Spinner'
import { ErrorState } from '../components/EmptyState'

export default function ListingForm() {
  const { id } = useParams()
  const isEdit = !!id
  const { user } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    type: user.role === 'SEEKER' ? 'LOOKING_FOR_FLAT' : 'FLAT_AVAILABLE',
    location: '',
    rentMin: '',
    rentMax: '',
    availableFrom: '',
    genderPreference: 'CO_ED',
  })
  const [amenities, setAmenities] = useState([])
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(isEdit)
  const [loadError, setLoadError] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!isEdit) return undefined
    let cancelled = false
    listingsApi
      .get(id)
      .then((l) => {
        if (cancelled) return
        if (l.postedBy?.id !== user.id) {
          toast.error('Only the owner can edit this listing')
          navigate(`/listings/${id}`, { replace: true })
          return
        }
        setForm({
          type: l.type,
          location: l.location || '',
          rentMin: l.rentMin ?? '',
          rentMax: l.rentMax ?? '',
          availableFrom: toDateInput(l.availableFrom),
          genderPreference: l.genderPreference,
        })
        setAmenities(splitList(l.amenities))
        setLoading(false)
      })
      .catch((e) => {
        if (cancelled) return
        setLoadError(true)
        setLoading(false)
        toastError(e, 'Could not load listing')
      })
    return () => {
      cancelled = true
    }
  }, [id, isEdit, user.id, navigate])

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    const rentMin = numOrNull(form.rentMin)
    const rentMax = numOrNull(form.rentMax)
    const errs = {}
    if (!form.location.trim()) errs.location = 'Location is required'
    if (rentMin != null && rentMin < 0) errs.rentMin = 'Cannot be negative'
    if (rentMax != null && rentMax < 0) errs.rentMax = 'Cannot be negative'
    if (rentMin != null && rentMax != null && rentMax < rentMin) errs.rentMax = 'Must be at least the minimum rent'
    setErrors(errs)
    if (Object.keys(errs).length) return

    const body = {
      type: form.type,
      location: form.location.trim(),
      rentMin,
      rentMax,
      availableFrom: form.availableFrom || null,
      amenities: amenities.length ? amenities.join(', ') : null,
      genderPreference: form.genderPreference,
    }
    setBusy(true)
    try {
      const saved = isEdit ? await listingsApi.update(id, user.id, body) : await listingsApi.create(user.id, body)
      toast.success(isEdit ? 'Listing updated' : 'Listing created')
      navigate(`/listings/${saved.id}`)
    } catch (err) {
      toastError(err, 'Could not save listing')
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <Spinner />
  if (loadError) return <ErrorState message="We could not load this listing." />

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-4 text-2xl font-bold text-slate-900">{isEdit ? 'Edit listing' : 'Create listing'}</h1>
      <form onSubmit={submit} noValidate className="card space-y-5 p-5">
        <div>
          <label htmlFor="type" className="label">Listing type</label>
          <select id="type" className="input" value={form.type} onChange={set('type')}>
            {LISTING_TYPES.map((t) => <option key={t} value={t}>{LISTING_TYPE_LABEL[t]}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="location" className="label">Location</label>
          <input id="location" className="input" value={form.location} onChange={set('location')} placeholder="e.g. Lokhandwala, Andheri West" aria-invalid={!!errors.location} />
          {errors.location && <p className="field-error">{errors.location}</p>}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="rentMin" className="label">Rent from (₹/month)</label>
            <input id="rentMin" type="number" min="0" className="input" value={form.rentMin} onChange={set('rentMin')} />
            {errors.rentMin && <p className="field-error">{errors.rentMin}</p>}
          </div>
          <div>
            <label htmlFor="rentMax" className="label">Rent up to (₹/month)</label>
            <input id="rentMax" type="number" min="0" className="input" value={form.rentMax} onChange={set('rentMax')} />
            {errors.rentMax && <p className="field-error">{errors.rentMax}</p>}
          </div>
        </div>
        <div>
          <label htmlFor="availableFrom" className="label">Available from</label>
          <input id="availableFrom" type="date" className="input" value={form.availableFrom} onChange={set('availableFrom')} />
        </div>
        <ChipInput id="amenities" label="Amenities" value={amenities} onChange={setAmenities} suggestions={AMENITY_SUGGESTIONS} placeholder="Add an amenity" />
        <div>
          <label htmlFor="gender" className="label">Gender preference</label>
          <select id="gender" className="input" value={form.genderPreference} onChange={set('genderPreference')}>
            {GENDER_PREFERENCES.map((g) => <option key={g} value={g}>{GENDER_LABEL[g]}</option>)}
          </select>
        </div>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Link to={isEdit ? `/listings/${id}` : '/listings'} className="btn-secondary">Cancel</Link>
          <button type="submit" className="btn-primary" disabled={busy}>{busy ? 'Saving…' : isEdit ? 'Save changes' : 'Create listing'}</button>
        </div>
      </form>
    </div>
  )
}
