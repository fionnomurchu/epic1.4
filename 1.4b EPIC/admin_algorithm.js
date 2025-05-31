  import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

//create Supabase client instance to interact w Supabase backend
//anon key=JWT(authenticates app for accessing db w public permissions)
  const supabaseUrl = 'https://arzbecskqesqesfgmkgu.supabase.co'
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFyemJlY3NrcWVzcWVzZmdta2d1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5Mzc3NDcsImV4cCI6MjA2MzUxMzc0N30.j_JklSlOYHuuKEIDdSkgeiemwY1lfNQMk0fRoJfb2pQ';
  const supabase = createClient(supabaseUrl, supabaseKey)

  let array = [];
//map residencies to year values
  const residencyMap = {
    "R1, R1+R2": 1,
    "R2": 2,
    "R3": 3,
    "R4": 3,
    "R5": 4
  };

//listens for click event
//sets text to "Running algorithm"
//retrieve selected value from drop down
//converts dropdown value to numerical value
  document.getElementById('run-algo').addEventListener('click', async () => {
    document.getElementById('algo-status').textContent = 'Running algorithm...';
      const select = document.getElementById('residency-filter');
    const selectedValue = select.value;
    const year = residencyMap[selectedValue];
  console.log(selectedValue);  
  console.log(year);
    
    
    try {
      await runAlgorithm(selectedValue, year);
      document.getElementById('algo-status').textContent = 'Algorithm completed successfully!';
    } catch (error) {
      document.getElementById('algo-status').textContent = 'An error occurred while running the algorithm.';
      console.error('Algorithm error:', error);
    }
  });



  async function runAlgorithm(residency_number, year) {
    await fetchResidencyTable(residency_number);

//fetch from students table
//joins with rank_id table via FK
//filters for students in specified year, from best to worst
    const { data: students, error } = await supabase
      .from('students')
      .select(`
        name,
        student_id,
        classRank,
        ranking:rank_id(*)
      `)
      .eq('year',year)
      .order('classRank', { ascending: true });

  if (error) {
    throw new Error('Error fetching students: ' + error.message);
  }
    console.log('Fetched students:', students); // Debug output


    for (const student of students) {
      await processStudent(student);
    }

    await handleUnderfilledResidencies();  // <-- handles leftovers
  }

  //fetches data from db + formats it into array for matching algorithm
  async function fetchResidencyTable(residency_number) {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('residency_number', residency_number);

    if (error) {
      console.error('Error fetching residencies:', error);
      return;
    }
//each residency becomes an array of 8 elements
    array = data.map(row => [row.id, row.title, row.residency_number, row.number_of_positions,0,0,0,0,0,0,0]);
    console.log('Residency table fetched:', array);
  }

  function residencyExists(residencyName) {
    return array.some(row => row[1] === residencyName);
  }

  function residencyIndex(residencyName) {
    return array.findIndex(row => row[1] === residencyName);
  }

  async function processStudent(student) {
    let alloc_count = 0;
//loop through students top 3 rankings
//get students i-th choice
//if placement fails, move to rank i+1

    for (let i = 1; alloc_count < 3; i++) {
      const rankKey = `rank${i}`;
      const residency = student.ranking[rankKey];
      console.log(`Processing student: ${student.name}, Residency: ${residency}`);
      //skip if no residency exists for this rank
      if (!residency) continue;
      //skip if residency program !exist
      const exists = residencyExists(residency);
      console.log(`Residency exists: ${exists}`);
      if (!exists) continue;


      //problem here
      const index = residencyIndex(residency);
      array[index][4] += 1;
      const count = array[index][4];
      console.log(`Current count for ${residency}: ${count}`);
      if (count == 1) {
        array[index][5] = student.student_id
        console.log(`First allocation for ${residency}: ${array[index][5]}`);
      }else if (count == 2) {
      array[index][6] = student.student_id;
        console.log(`Second allocation for ${residency}: ${array[index][6]}`);
      }else if (count == 3) {
        array[index][7] = student.student_id;
        console.log(`Third allocation for ${residency}: ${array[index][7]}`);
      if(array[index][3] ==1){
        const last3 = array[index].slice(-6);
      await insertInterviews(last3,array[index][1]);
      }
      }else if (count == 4) {
        array[index][8] = student.student_id
        console.log(`4th allocation for ${residency}: ${array[index][8]}`);
      }else if (count == 5) {
      array[index][9] = student.student_id;
        console.log(`5th allocation for ${residency}: ${array[index][9]}`);
      }else if (count == 6) {
        array[index][10] = student.student_id;
        console.log(`6th allocation for ${residency}: ${array[index][10]}`);
      if(array[index][3] ==2){
        const last3 = array[index].slice(-6);
      await insertInterviews(last3,array[index][1]);
      }
    }




      //create interviews if residency is full and increase alloc_count to show students been allocated a place
      if (count <= array[index][3]*3) {
        console.log('manipulating')
        await manipulate('interview', student.student_id, residency);
        alloc_count++;
      }
    }
  }





async function insertInterviews(interview,jobtitle) {

  //sets all 0 values to null
const interviews = interview.map(value => value === 0 ? null : value);

//inserts new row w 3 interview slots
  const { data, error } = await supabase
    .from('companyInterview')
    .insert([
      {
        interview1: interviews[0],
        interview2: interviews[1],
        interview3: interviews[2],
        interview4: interviews[3],
        interview5: interviews[4],
        interview6: interviews[5],
      },
    ]).select();

  if (error) {
    console.error("Error inserting interviews:", error);
    return null;
  }
//extracts auto generated id from new record
//updates corresponding job preference w interview
  const insertedId = data[0]?.id;
  console.log("Inserted row ID:", insertedId);
await updateStudentInterview( jobtitle,insertedId)
  return data;
}



async function updateStudentInterview(jobtitle, interviewId) {
  //prevents null values that would corrupt relationships
  if (!jobtitle || interviewId === undefined) {
    throw new Error("Both jobtitle and interviewId must be provided.");
  }
//set interview_id as FK
//target specific residency by title
  const { data, error } = await supabase
    .from('jobs')
    .update({ interview_id: interviewId })
    .eq('title', jobtitle)
    .select(); // optional: returns updated row

  if (error) {
    console.error("Error updating interview_id:", error);
    return null;
  }

  return data;
}


  async function manipulate(table, studentnum, res) {
    //verify if student already has interview record
    //if it doesnt, create new record
    const exists = await attributeExists(table, 'id', studentnum);
    if (exists) {
      const isNull = await isAttributeNull(table, 'id', studentnum, 'interview2');
      if (isNull) {
        //find interview 2 in table and update based on algorithm
        await updateAttribute(table, 'id', studentnum, 'interview2', res);
      } else {
        //find interview 3 slot and update based on algorithm
        await updateAttribute(table, 'id', studentnum, 'interview3', res);
        await updateAttribute('students', 'student_id', studentnum, 'interviewid', studentnum);
      }
    } else {
      await addEntity(table, studentnum, res);
    }
  }

  async function attributeExists(tableName, columnName, valueToMatch) {
    //queries only one specified column
    //stops after 1 match
    const { data, error } = await supabase
      .from(tableName)
      .select(columnName)
      .eq(columnName, valueToMatch)
      .limit(1);

    if (error) {
      console.error('Error checking attribute:', error);
      return false;
    }
//true if atleast one matching record
    return data.length > 0;
  }

async function isAttributeNull(table, key, value, attribute) {
    const { data, error } = await supabase
      .from(table)
      .select(attribute)
      .eq(key, value)
      .single();

    if (error) {
      console.error('Error checking null attribute:', error);
      return false;
    }
//return true if data is null/undefined || if a data attributes null
    return data?.[attribute] === null;
  }

  //function to allocate student their first residency
  async function addEntity(table, id, allo1Value) {
    const { data, error } = await supabase
      .from(table)
      .insert([{ id: id, interview1: allo1Value }]);

    if (error) {
      console.error('Insert error:', error);
      return false;
    }

    return true;
  }

async function handleUnderfilledResidencies() {
  for (let i = 0; i < array.length; i++) {
    const count = array[i][4];              // Number of allocated students
    const capacity = array[i][3] * 3;       // Max slots
    const residencyName = array[i][1];

    if (count > 0 && count < capacity) {
      console.log(`Residency ${residencyName} underfilled with ${count} slots filled.`);

      // Get the last 6 elements for interview student IDs
      const last3 = array[i].slice(-6);
      await insertInterviews(last3, residencyName);
    }
  }
}


  //updates specific attribute in any table where a matching column has specified value
  async function updateAttribute(table, matchColumn, matchValue, attribute, newValue) {
    const { data, error } = await supabase
      .from(table)
      .update({ [attribute]: newValue })
      .eq(matchColumn, matchValue);

    if (error) {
      console.error('Update error:', error);
      return false;
    }

    return true;
  }
