// Full-width teal band that opens a page. `children` render below the title row
// (search form, tabs). `action` sits at the top right.
export default function PageHero({ title, subtitle, action = null, children = null }) {
  return (
    <section className="on-dark bg-brand-600 text-white">
      <div className="shell py-8 sm:py-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-4xl font-bold leading-tight sm:text-[2.75rem]">{title}</h1>
            {subtitle && <p className="mt-2 max-w-xl text-lg text-brand-100">{subtitle}</p>}
          </div>
          {action}
        </div>
        {children && <div className="mt-6">{children}</div>}
      </div>
    </section>
  )
}
