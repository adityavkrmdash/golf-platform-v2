import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'

const CharitiesPage = () => {
  const [charities, setCharities] = useState([])
  const [search, setSearch] = useState('')
  const [featuredOnly, setFeaturedOnly] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadCharities = async () => {
      try {
        const res = await api.get('/charities')
        setCharities(res.data || [])
      } catch (err) {
        setError(err.response?.data?.msg || 'Failed to load charities')
      } finally {
        setLoading(false)
      }
    }

    loadCharities()
  }, [])

  const filteredCharities = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return charities.filter((charity) => {
      const matchesSearch =
        !normalizedSearch ||
        charity.name?.toLowerCase().includes(normalizedSearch) ||
        charity.description?.toLowerCase().includes(normalizedSearch)

      const matchesFeatured = !featuredOnly || charity.featured

      return matchesSearch && matchesFeatured
    })
  }, [charities, featuredOnly, search])

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#071411_0%,#0d2320_45%,#f5efe3_45%,#f5efe3_100%)]">
      <section className="relative overflow-hidden px-4 pb-14 pt-8 sm:px-6 sm:pb-20 lg:px-8">
        <div className="absolute left-[-80px] top-[-40px] h-52 w-52 rounded-full bg-[#d7a84a]/20 blur-3xl sm:h-64 sm:w-64" />
        <div className="absolute right-[-60px] top-40 h-52 w-52 rounded-full bg-[#4f8b73]/20 blur-3xl sm:h-64 sm:w-64" />

        <div className="relative mx-auto max-w-7xl">
          <div className="flex flex-col gap-5 sm:gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#d7a84a] sm:tracking-[0.35em]">
                Charity Partners
              </p>
              <h1 className="mt-3 text-3xl font-semibold leading-tight text-white sm:text-4xl lg:text-5xl">
                Search for a cause and explore it in detail.
              </h1>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link to="/register" className="rounded-full bg-[#d7a84a] px-5 py-3 text-center text-sm font-semibold text-[#0f2d28] transition hover:bg-[#e5ba63]">
                Subscribe to support
              </Link>
              <Link to="/donate" className="rounded-full border border-white/15 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-white/10">
                Make a donation
              </Link>
            </div>
          </div>

          <p className="mt-6 max-w-3xl text-sm leading-7 text-[#d7e2de] sm:text-base sm:leading-8">
            Browse charity partners, search by name or mission, and open a dedicated charity page before you choose where your support should go.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-[1fr_auto]">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search charities"
              className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-[#c7d7d2] focus:border-white/25"
            />
            <button
              type="button"
              onClick={() => setFeaturedOnly((prev) => !prev)}
              className={`rounded-full px-5 py-3 text-sm font-semibold transition ${
                featuredOnly
                  ? 'bg-[#d7a84a] text-[#0f2d28]'
                  : 'border border-white/15 text-white hover:bg-white/10'
              }`}
            >
              {featuredOnly ? 'Showing featured' : 'Featured only'}
            </button>
          </div>
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {loading && (
            <div className="rounded-[2rem] border border-[#0f2d28]/10 bg-white p-6 text-sm text-[#39544d] shadow-[0_20px_60px_rgba(15,45,40,0.08)]">
              Loading charities...
            </div>
          )}

          {error && (
            <div className="rounded-[2rem] border border-red-200 bg-red-50 p-6 text-sm text-red-600">
              {error}
            </div>
          )}

          {!loading && !error && filteredCharities.length === 0 && (
            <div className="rounded-[2rem] border border-[#0f2d28]/10 bg-white p-6 text-sm text-[#39544d] shadow-[0_20px_60px_rgba(15,45,40,0.08)]">
              No charities matched your current search.
            </div>
          )}

          {!loading && !error && filteredCharities.length > 0 && (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filteredCharities.map((charity) => (
                <div
                  key={charity.id}
                  className="rounded-[2rem] border border-[#0f2d28]/10 bg-white p-5 shadow-[0_20px_60px_rgba(15,45,40,0.08)] sm:p-6"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#9e6d16] sm:text-xs sm:tracking-[0.3em]">
                        {charity.featured ? 'Featured charity' : 'Charity partner'}
                      </p>
                      <h2 className="mt-4 text-2xl font-semibold text-[#0f2d28]">
                        {charity.name}
                      </h2>
                    </div>

                    {charity.featured && (
                      <span className="rounded-full bg-[#d7a84a] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#0f2d28]">
                        Featured
                      </span>
                    )}
                  </div>

                  {charity.image_url && (
                    <img
                      src={charity.image_url}
                      alt={charity.name}
                      className="mt-5 h-48 w-full rounded-2xl object-cover"
                    />
                  )}

                  <p className="mt-4 text-sm leading-7 text-[#39544d]">
                    {charity.description || 'More details about this charity will appear soon.'}
                  </p>

                  <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <Link
                      to={`/charities/${charity.id}`}
                      className="rounded-full border border-[#0f2d28]/10 px-5 py-3 text-center text-sm font-semibold text-[#0f2d28] transition hover:bg-[#f4efe4]"
                    >
                      View details
                    </Link>
                    <Link
                      to="/donate"
                      className="rounded-full bg-[#0f2d28] px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-[#18443c]"
                    >
                      Donate
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

export default CharitiesPage
