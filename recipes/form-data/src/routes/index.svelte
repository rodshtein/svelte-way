<script>
async function submit() {
  let data = new FormData(this); // `this` - it's form body 
  let response = await fetch('/', { 
    method: 'POST',
	  headers: { 'accept': 'application/json'},  
    // ↑ we need the `Header` to receive endpoint response instead html page
    body: data 
  });
  alert(await response.text()) // get response
}
</script>

<form on:submit|preventDefault={submit}>
  <input type="text" name="name">
  <input type="file" name="file" accept="image/*">
  <input type="submit">
</form>
