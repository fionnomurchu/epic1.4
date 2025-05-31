 import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://arzbecskqesqesfgmkgu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFyemJlY3NrcWVzcWVzZmdta2d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5Mzc3NDcsImV4cCI6MjA2MzUxMzc0N30.j_JklSlOYHuuKEIDdSkgeiemwY1lfNQMk0fRoJfb2pQ';
const supabase = createClient(supabaseUrl, supabaseKey);

window.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('interview-list');

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    container.innerHTML = '<p>Error: No user logged in.</p>';
    return;
  }

  const { data: student, error: studentError } = await supabase
    .from('students')
    .select('*')
    .eq('email', user.email)
    .single();

  if (studentError || !student) {
    container.innerHTML = '<p>Error: Student profile not found.</p>';
    return;
  }


  const { data: interview, error: interviewError } = await supabase
    .from('interview')
    .select('*')
    .eq('id', student.interviewid)
    .single();

    console.log('Interview data:', interview); // Debug output

    const jobtitle1 = interview.interview1;
const jobtitle2 = interview.interview2;
const jobtitle3 = interview.interview3;

const interviewTitles = [jobtitle1, jobtitle2, jobtitle3];

// Fetch all relevant jobs in one query
const { data: jobs, error: jobsError } = await supabase
  .from('jobs')
  .select('title, contact_email')
  .in('title', interviewTitles);

if (jobsError || !jobs) {
  console.error("Error fetching job emails:", jobsError);
  return;
}

// Create a map from job title to contact_email
const emailMap = {};
jobs.forEach(job => {
  emailMap[job.title] = job.contact_email;
});

// Create an object mapping each interview slot to its corresponding email
const interviewEmailMap = {
  interview1: emailMap[jobtitle1] || 'Email not found',
  interview2: emailMap[jobtitle2] || 'Email not found',
  interview3: emailMap[jobtitle3] || 'Email not found',
};

console.log(interviewEmailMap);



  if (interviewError || !interview) {
    container.innerHTML = '<p>No interview data found.</p>';
    return;
  }

  ['interview1', 'interview2', 'interview3'].forEach(key => {
    if (interview[key]) {
      const div = document.createElement('div');
      div.className = 'interview-card';
      div.textContent = interview[key];
      
      div.textContent += ' ' + interviewEmailMap[key];
      container.appendChild(div);
    }
  });


    // Fetch all offer entries where student_id matches current user
  const { data: offers, error: offerError } = await supabase
    .from('offer') // Replace with your actual table name if different
    .select('*')
    .eq('student_id', student.student_id );

  if (offerError) {
    console.error('Error fetching offers:', offerError);
    return null;
  }

  console.log('Offers for student:', offers);

  displayOfferJobTitles(offers, student);

});


function displayOfferJobTitles(offers,student) {
  const container = document.getElementById('offers-container'); // Make sure this exists in your HTML
  container.innerHTML = ''; // Clear any previous entries

  if (!offers || offers.length === 0) {
    container.textContent = 'No offers found.';
    return;
  }


const offerContainer = document.getElementById('offers-container');
displayOfferButtons(offers, offerContainer, student);

}



function displayOfferButtons(offers, container,student) {
  container.innerHTML = ''; // Clear previous contents

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
      const buttons = groupDiv.querySelectorAll('.interview-card');
      buttons.forEach(btn => btn.classList.remove('selected'));
      button.classList.add('selected');
    });

    groupDiv.appendChild(button);
  });

  // Create Submit Button
  const submitBtn = document.createElement('button');
  submitBtn.textContent = 'Submit Selection';
  submitBtn.className = 'submit-button';

  submitBtn.addEventListener('click', async () => {
    const selected = groupDiv.querySelector('.interview-card.selected');
    if (!selected) {
      alert('Please select an offer first.');
      return;
    }

    const selectedOfferId = selected.dataset.offerId;
    const jobTitle = selected.dataset.jobTitle;

//
///

/////
////

  const studentId = student.student_id;

  // Step 2: Set all offers for this student to accepted = false
  const { error: resetError } = await supabase
    .from('offer')
    .update({ accepted: false })
    .eq('student_id', studentId);

  if (resetError) {
    console.error('Failed to reset offers:', resetError);
    alert('Something went wrong resetting old offers.');
    return;
  }




   //Step 3: Update the selected offer row to mark it as accepted
  const { data, error } = await supabase
    .from('offer') // your existing offer table
    .update({ accepted: true })
    .eq('id', selectedOfferId);


    if (error) {
      console.error('Submission failed:', error);
      alert('Submission failed. Please try again.');
    } else {
      console.log('Submitted:', data);
      alert('Offer submitted successfully!');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Submitted';
    }

const { data: rejected, error: jobsError } = await supabase
  .from('offer')
  .select('*')
  .eq('student_id', studentId)
    .eq('accepted',false);


    console.log('Rejected Offers:', rejected);

    await resetJobOfferStatus(rejected);
  });





  groupDiv.appendChild(submitBtn);
  container.appendChild(groupDiv);
}




async function resetJobOfferStatus(rejected) {
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
  await supabase.auth.signOut()
  localStorage.clear()
  window.location.href = 'index.html'
})