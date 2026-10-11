// The little skyline motif used on listing banners and suggestion tiles.
// Bars are white at low opacity so they pick up whatever colour sits behind them.
export default function BuildingArt({ className = '' }) {
  return (
    <div className={`flex items-end gap-[6%] ${className}`} aria-hidden="true">
      <span className="h-[55%] w-[26%] rounded-t-md bg-white/40" />
      <span className="h-full w-[32%] rounded-t-md bg-white/40" />
      <span className="h-[42%] w-[24%] rounded-t-md bg-white/40" />
    </div>
  )
}
