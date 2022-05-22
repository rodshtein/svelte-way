import fs from 'node:fs'; 
// read more about esm modules in node 18.2
// https://nodejs.org/api/esm.html


export async function post({ request }) {
  const data = await request.formData();
  let file = data.get('file'); // file_name → field name in <form>
  let name = data.get('name'); // file → field name in <form>

  // check that we received all data
  // if some data is empty - send error
  if(!name) return {
    body: { status:  'Please introduce yourself.'} 
  };
  if(!file) return {
    body: { status: `${name}, attach file and try again` }  
  };

  let ab = await file.arrayBuffer(); // get binary data from file

  fs.writeFile(`./test-folder/${file.name}`, Buffer.from(ab), e => {
    if(e) console.error(e) 
  })

  return {
    body: { status: `${name}, file: ${file.name} - has been uploaded` } // if all ok response something
  };
}
