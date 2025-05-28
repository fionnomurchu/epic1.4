import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'
const supabase = createClient('https://arzbecskqesqesfgmkgu.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFyemJlY3NrcWVzcWVzZmdta2d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5Mzc3NDcsImV4cCI6MjA2MzUxMzc0N30.j_JklSlOYHuuKEIDdSkgeiemwY1lfNQMk0fRoJfb2pQ')

const user = (await supabase.auth.getUser()).data.user
if (!user) {
  alert("Please log in.")
  window.location.href = 'index.html'
}

const { data: company } = await supabase
  .from('companies')
  .select('id')
  .eq('email', user.email)
  .single()

const companyId = company?.id
if (!companyId) return

// Step 1: Load jobs owned by the company
const { data: jobs } = await supabase
  .from('jobs')
  .select('id, title, num_positions')
  .eq('company_id', companyId)

const jobMap = {}
jobs.forEach(job => jobMap[job.id] = { ...job, offersSent: 0 })

// Step 2: Load interview allocations
const { data: interviewData } = await supabase
  .from('interviews')
  .select('*')

const studentIds = []
const matched = []

interviewData.forEach(entry => {
  ['interview1', 'interview2', 'interview3'].forEach(slot => {
    if (jobMap[entry[slot]]) {
      matched.push({ student_id: entry.student_id, job_id: entry[slot] })
      studentIds.push(entry.student_id)
    }
  })
})

const { data: students } = await supabase
  .from('students')
  .select('student_id, name, email')
  .in('student_id', studentIds)

const interviewCards = document.getElementById('interview-cards')
matched.forEach(match => {
  const student = students.find(s => s.student_id === match.student_id)
  const job = jobMap[match.job_id]

  const card = document.createElement('div')
  card.className = 'interview-card'
  card.innerHTML = `
    <h3>${student.name}</h3>
    <p>Position: ${job.title}</p>
    <p>Email: <a href="mailto:${student.email}">${student.email}</a></p>
  `
  interviewCards.appendChild(card)
})

// Step 3: Offers section — choose who to offer to
const offerSection = document.getElementById('offer-students')
matched.forEach((match, i) => {
  const student = students.find(s => s.student_id === match.student_id)
  const job = jobMap[match.job_id]

  const box = document.createElement('div')
  box.className = 'offer-box'
  box.innerHTML = `
    <h3>${student.name} — ${job.title}</h3>
    <label>
      <input type="checkbox" name="offer" value="${match.student_id}|${match.job_id}">
      Offer student position?
    </label>
  `
  offerSection.appendChild(box)
})

// Step 4: Submit offers
document.getElementById('offer-form').addEventListener('submit', async (e) => {
  e.preventDefault()

  const selected = Array.from(document.querySelectorAll('input[name="offer"]:checked'))
  const offerCounts = {}

  selected.forEach(input => {
    const [, jobId] = input.value.split('|')
    offerCounts[jobId] = (offerCounts[jobId] || 0) + 1
  })

  // Validate position limits
  for (const jobId in offerCounts) {
    const job = jobMap[jobId]
    const { data: sentOffers } = await supabase
      .from('offers')
      .select('*')
      .eq('job_id', jobId)

    if ((sentOffers?.length || 0) + offerCounts[jobId] > job.num_positions) {
      alert(`You can only send ${job.num_positions} offers for ${job.title}.`)
      return
    }
  }

  if (!confirm("Are you sure you want to send these offers? This cannot be undone.")) return

  for (const input of selected) {
    const [studentId, jobId] = input.value.split('|')
    await supabase.from('offers').insert({
      student_id: studentId,
      job_id: jobId
    })
  }

  alert("Offers sent!")
  location.reload()
})

// Step 5: Display offer status
const { data: sentOffers } = await supabase
  .from('offers')
  .select('student_id, job_id, accepted, rejected')

const statusBox = document.getElementById('offer-status')
sentOffers.forEach(offer => {
  const student = students.find(s => s.student_id === offer.student_id)
  const job = jobMap[offer.job_id]
  let status = 'Pending'
  if (offer.accepted) status = 'Accepted'
  if (offer.rejected) status = 'Rejected'

  const div = document.createElement('div')
  div.className = 'offer-box'
  div.innerHTML = `
    <h3>${student.name} — ${job.title}</h3>
    <p>Status: <strong>${status}</strong></p>
  `
  statusBox.appendChild(div)
})

// Logout
document.getElementById('logout').addEventListener('click', async () => {
  await supabase.auth.signOut()
  localStorage.clear()
  window.location.href = 'index.html'
})