<script context="module">
  import { browser } from '$app/env';
  import { setCookie } from '$lib/cookie'

  export async function load({ session }) {

    // get theme set by the hook src/hook.js
    const { theme = 'auto' } = session.user;

    return {
      props: {
        theme
      }
    }
  }
</script>

<script>
  export let theme;

  $: saveUserTheme(theme)

  function saveUserTheme () {
    if(!browser) return
    setCookie('theme', theme)
  }

  // TODO Need fallback?
</script>


<svelte:head>
  <!-- Specifies one or more color schemes with which the document is compatible -->
  <meta name='color-scheme' content='light dark'>

  <!-- Tabs color by current theme -->
  {#if theme === 'auto'}
    <meta name='theme-color' media='(prefers-color-scheme: light)' content='#D6D6D6'>
    <meta name='theme-color' media='(prefers-color-scheme: dark)'  content='#252526'>
  {:else if theme === 'light'}
    <meta name='theme-color' content='#D6D6D6'>
  {:else if theme === 'dark'}
    <meta name='theme-color' content='#252526'>
  {/if}

  <!-- Defining system styles -->
  <link rel='stylesheet' href='styles/light.css' media='(prefers-color-scheme: light)' >
  <link rel='stylesheet' href='styles/dark.css' media='(prefers-color-scheme: dark)' >

  <!-- Override styles instead of replacing them to prevent blinking -->
  {#if theme === 'light'}
  <link rel='stylesheet' href='styles/light.css'>
  {:else if theme === 'dark'}
  <link rel='stylesheet' href='styles/dark.css'>
  {/if}

</svelte:head>


<h1>Svelte Kit - Theme switcher demo</h1>


  <label for='r1'> <input bind:group={theme} id='r1' type='radio' name='color-scheme' value='auto' checked> system</label>

  <label for='r2'> <input bind:group={theme} id='r2' type='radio' name='color-scheme' value='light'> light</label>

  <label for='r3'> <input bind:group={theme} id='r3' type='radio' name='color-scheme' value='dark'> dark</label>


<style>
  :global(body) {
    margin: 40px;
    color: var(--font-color);
    background-color: var(--bg-color);
    font-family: sans-serif;
  }
  label, input {
    cursor: pointer;
  }
</style>