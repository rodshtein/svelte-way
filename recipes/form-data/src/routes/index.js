import fs from 'node:fs'; 
// read more about esm modules in nodejs
// https://nodejs.org/api/esm.html


export async function post({ request }) {
  const data = await request.formData();
  let file = data.get('file'); // file → field name in <form>
  let name = data.get('name'); // name → field name in <form>

  // check that we received all data
  // if some data is empty - send error
  if(!name) return {
    body: 'Please introduce yourself.'
  };
  if(!file) return {
    body: `${name}, attach file and try again`  
  };
  
  // if all ok - get the binary data from file
  let ab = await file.arrayBuffer(); 

  // save to folder
  fs.writeFile(`./test-folder/${file.name}`, Buffer.from(ab), e => {
    // Process errors
    if(e) return {
      body: `Error by save the file: ${e}`
    };
  })

  // if all ok response something
  return {
    body: `${name}, file: ${file.name} - has been saved`
  };
}
