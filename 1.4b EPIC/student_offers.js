import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const supabase = createClient('https://arzbecskqesqesfgmkgu.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFyemJlY3NrcWVzcWVzZmdta2d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5Mzc3NDcsImV4cCI6MjA2MzUxMzc0N30.j_JklSlOYHuuKEIDdSkgeiemwY1lfNQMk0fRoJfb2pQ')

const interviewContainer = document.getElementById('interview-cards')
const offersContainer = document.getElementById('offers-container')
const offerForm = document.getElementById('offer-form')

// Get user session
const { data: { user }, error } = await supabase.auth.getUser()
if (error || !user) {
  alert('You must be logged in to view this page.')
  window.location.href = 'index.html'
}

// Fetch interview data
const { data: interviewData } = await supabase
  .from('interviews')
  .select('*')
  .eq('student_id', user.id)
  .single()

if (interviewData) {
  const jobIds = [interviewData.interview1, interviewData.interview2, interviewData.interview3].filter(Boolean)

  const { data: jobs } = await supabase
    .from('jobs')
    .select('id, title, company_id')
    .in('id', jobIds)

  const companyIds = [...new Set(jobs.map(j => j.company_id))]
  const { data: companies } = await supabase
    .from('companies')
    .select('id, email')
    .in('id', companyIds)

  jobs.forEach(job => {
    const company = companies.find(c => c.id === job.company_id)
    const card = document.createElement('div')
    card.className = 'interview-card'
    card.innerHTML = `
      <h3>${job.title}</h3>
      <p>Email: <a href="mailto:${company.email}">${company.email}</a></p>
    `
    interviewContainer.appendChild(card)
  })
}

// Fetch offers
const { data: offers } = await supabase
  .from('offers')
  .select('id, job_id, sent_at, accepted, rejected')
  .eq('student_id', user.id)

if (offers.length === 0) {
  offersContainer.innerHTML = `<p>Pending — no offers yet.</p>`
} else {
  const jobIds = offers.map(o => o.job_id)
  const { data: jobs } = await supabase
    .from('jobs')
    .select('id, title')
    .in('id', jobIds)

  offers.forEach(offer => {
    const job = jobs.find(j => j.id === offer.job_id)
    const timeLeft = 7 - Math.floor((Date.now() - new Date(offer.sent_at)) / (1000 * 60 * 60 * 24))
    const offerBox = document.createElement('div')
    offerBox.className = 'offer-box'
    offerBox.innerHTML = `
      <h3>${job.title}</h3>
      <p>${timeLeft > 0 ? `${timeLeft} days left to accept` : 'Expired'}</p>
      <label>
        <input type="checkbox" name="offer" value="${offer.id}" ${offer.accepted ? 'checked disabled' : ''} />
        Accept
      </label>
    `
    offersContainer.appendChild(offerBox)
  })
}

// Submit offer choice
offerForm.addEventListener('submit', async (e) => {
  e.preventDefault()

  const selected = document.querySelector('input[name="offer"]:checked')
  if (!selected) return alert('Please select an offer to accept.')

  const confirmAccept = confirm('Are you sure you want to accept this offer? You cannot undo this.')
  if (!confirmAccept) return

  const { error } = await supabase
    .from('offers')
    .update({ accepted: true, rejected: false })
    .eq('id', selected.value)

  // Mark other offers as rejected
  const { data: allOffers } = await supabase
    .from('offers')
    .select('id')
    .eq('student_id', user.id)

  const otherOfferIds = allOffers.map(o => o.id).filter(id => id !== selected.value)

  await supabase
    .from('offers')
    .update({ rejected: true })
    .in('id', otherOfferIds)

  alert('Offer accepted!')
  location.reload()
})
