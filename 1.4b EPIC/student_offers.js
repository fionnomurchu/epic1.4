import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://arzbecskqesqesfgmkgu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFyemJlY3NrcWVzcWVzZmdta2d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5Mzc3NDcsImV4cCI6MjA2MzUxMzc0N30.j_JklSlOYHuuKEIDdSkgeiemwY1lfNQMk0fRoJfb2pQ';
const supabase = createClient(supabaseUrl, supabaseKey);

document.addEventListener('DOMContentLoaded', async () => {
  const interviewContainer = document.getElementById('interview-list');
  const offersContainer = document.getElementById('offers-container');

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    interviewContainer.innerHTML = '<p>Error: No user logged in.</p>';
    return;
  }

  const { data: student, error: studentError } = await supabase
    .from('students')
    .select('*')
    .eq('email', user.email)
    .single();

  if (studentError || !student) {
    interviewContainer.innerHTML = '<p>Error: Student profile not found.</p>';
    return;
  }

  const { data: interview, error: interviewError } = await supabase
    .from('interview')
    .select('*')
    .eq('id', student.interviewid)
    .single();

  if (interviewError || !interview) {
    interviewContainer.innerHTML = '<p>No interview data found.</p>';
    return;
  }

  const interviewTitles = [interview.interview1, interview.interview2, interview.interview3].filter(Boolean);
  const { data: jobs, error: jobsError } = await supabase
    .from('jobs')
    .select('title, contact_email')
    .in('title', interviewTitles);

  if (jobsError || !jobs) {
    console.error("Error fetching job emails:", jobsError);
    return;
  }

  const emailMap = {};
  jobs.forEach(job => {
    emailMap[job.title] = job.contact_email;
  });

  ['interview1', 'interview2', 'interview3'].forEach(key => {
    if (interview[key]) {
      const div = document.createElement('div');
      div.className = 'interview-card';
      div.innerHTML = `
        <strong>${interview[key]}</strong><br>
        <span>Email: <a href="mailto:${emailMap[interview[key]] || 'Email not found'}">
          ${emailMap[interview[key]] || 'Email not found'}
        </a></span>
      `;
      interviewContainer.appendChild(div);
    }
  });

  const { data: offers, error: offerError } = await supabase
    .from('offer')
    .select('*')
    .eq('student_id', student.student_id);

  if (offerError) {
    console.error('Error fetching offers:', offerError);
    offersContainer.innerHTML = '<p>Error loading offers.</p>';
    return;
  }

  renderOfferSection(offers, offersContainer, student);
});

function renderOfferSection(offers, container, student) {
  container.innerHTML = ''; // Clear any previous offers

  const acceptedOffer = offers.find(o => o.accepted);

  if (acceptedOffer) {
    // Accepted Offer Exists
    const box = document.createElement('div');
    box.className = 'offer-box';
    box.innerHTML = `
      <h2>You selected: ${acceptedOffer.job_title}</h2>
    `;
    container.appendChild(box);
    return;
  }

  // If no accepted offer yet — show selectable options
  const groupDiv = document.createElement('div');
  groupDiv.className = 'offer-group';

  const title = document.createElement('h3');
  title.textContent = 'Your Offers';
  groupDiv.appendChild(title);

  offers.forEach(offer => {
    const button = document.createElement('button');
    button.className = 'interview-card';
    button.textContent = offer.job_title;
    button.dataset.offerId = offer.id;
    button.dataset.jobTitle = offer.job_title;

    button.addEventListener('click', () => {
      groupDiv.querySelectorAll('.interview-card').forEach(btn => btn.classList.remove('selected'));
      button.classList.add('selected');
    });

    groupDiv.appendChild(button);
  });

  const submitBtn = document.createElement('button');
  submitBtn.textContent = 'Submit Selection';
  submitBtn.className = 'submit-button';

  submitBtn.addEventListener('click', async () => {
    const selected = groupDiv.querySelector('.interview-card.selected');
    if (!selected) return alert('Please select an offer first.');

    const confirmed = confirm(`Are you sure you want to accept the offer for "${selected.dataset.jobTitle}"? This action cannot be undone.`);
    if (!confirmed) return;

    const selectedOfferId = selected.dataset.offerId;

    // Reset all offers to accepted = false
    const { error: resetError } = await supabase
      .from('offer')
      .update({ accepted: false })
      .eq('student_id', student.student_id);

    if (resetError) {
      console.error('Failed to reset offers:', resetError);
      alert('Something went wrong resetting old offers.');
      return;
    }

    // Set selected offer as accepted
    const { error: acceptError } = await supabase
      .from('offer')
      .update({ accepted: true })
      .eq('id', selectedOfferId);

    if (acceptError) {
      console.error('Error accepting offer:', acceptError);
      alert('Could not accept offer.');
      return;
    }


    const { data: rejected, error: jobsError } = await supabase
  .from('offer')
  .select('*')
  .eq('student_id', student.student_id)
    .eq('accepted',false);

    await resetJobOfferStatus(rejected);



    alertStyled('Offer submitted successfully!');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitted';
    await sleep(2500);
    window.location.reload();
  });

  groupDiv.appendChild(submitBtn);
  container.appendChild(groupDiv);
}
function alertStyled(message) {
  const alertBox = document.createElement('div');
  alertBox.className = 'alert';
  alertBox.textContent = message;
  document.body.prepend(alertBox);
  setTimeout(() => alertBox.remove(), 5000);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}




async function resetJobOfferStatus(rejected) {

  console.log('in function resetJobOfferStatus');
  // Get unique job titles from the rejected array
  const jobTitles = [...new Set(rejected.map(item => item.job_title))];

  // Loop through and update each job's `has_offer` to false
  for (const title of jobTitles) {
    const { error } = await supabase
      .from('jobs')
      .update({ has_offer: false })
      .eq('title', title);

    if (error) {
      console.error(`Failed to update job "${title}":`, error);
    } else {
      console.log(`Job "${title}" updated to has_offer = false`);
    }
  }
}

document.getElementById('logout').addEventListener('click', async () => {
  await supabase.auth.signOut();
  localStorage.clear();
  window.location.href = 'index.html';
});