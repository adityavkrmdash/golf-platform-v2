import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api from '../api/axios'

const CharityDetailPage = () => {
  const { id } = useParams()
  const [charity, setCharity] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadCharity = async () => {
      try {
        setLoading(true)
        const res = await api.get(`/charities/${id}`)
        setCharity(res.data || null)
      } catch (err) {
        setError(err.response?.data?.msg || 'Failed to load charity')
      } finally {
        setLoading(false)
      }
    }

    loadCharity()
  }, [id])

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#071411_0%,#102822_42%,#f5efe3_42%,#f5efe3_100%)]">
      <section className="px-4 pb-14 pt-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <Link to="/charities" className="text-sm font-semibold text-[#d7a84a]">
            Back to charities
          </Link>

          {loading && <div className="mt-6 rounded-[2rem] bg-white p-6 text-sm text-[#39544d]">Loading charity...</div>}
          {error && <div className="mt-6 rounded-[2rem] border border-red-200 bg-red-50 p-6 text-sm text-red-600">{error}</div>}

          {!loading && !error && charity && (
            <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.95fr]">
              <div className="rounded-[2rem] border border-white/10 bg-[#0f2d28] p-6 text-white shadow-[0_24px_70px_rgba(0,0,0,0.22)] sm:p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#d7a84a]">
                  {charity.featured ? 'Featured charity' : 'Charity partner'}
                </p>
                <h1 className="mt-4 text-3xl font-semibold sm:text-4xl">{charity.name}</h1>
                <p className="mt-5 text-sm leading-8 text-[#d7e2de]">
                  {charity.description || 'More details about this charity will appear soon.'}
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link to="/register" className="rounded-full bg-[#d7a84a] px-5 py-3 text-center text-sm font-semibold text-[#0f2d28] transition hover:bg-[#e5ba63]">
                    Join and support
                  </Link>
                  <Link to="/donate" className="rounded-full border border-white/15 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-white/10">
                    Make a donation
                  </Link>
                </div>
              </div>

              <div className="space-y-6">
                {charity.image_url && (
                  <img src={charity.image_url} alt={charity.name} className="h-80 w-full rounded-[2rem] object-cover shadow-[0_20px_60px_rgba(15,45,40,0.12)]" />
                )}

                <div className="rounded-[2rem] border border-[#0f2d28]/10 bg-white p-6 shadow-[0_20px_60px_rgba(15,45,40,0.08)]">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9e6d16]">
                    Events and initiatives
                  </p>
                  <div className="mt-4 space-y-3">
                    {Array.isArray(charity.events) && charity.events.length > 0 ? (
                      charity.events.map((event, index) => (
                        <p key={`${charity.id}-${index}`} className="rounded-2xl bg-[#f5efe3] px-4 py-3 text-sm text-[#0f2d28]">
                          {event}
                        </p>
                      ))
                    ) : (
                      <p className="text-sm text-[#49645d]">No events listed yet.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

export default CharityDetailPage
