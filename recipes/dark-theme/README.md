`🇺🇸 English` [`🇷🇺 Русский`](README-RU.md)
# Svelte kit Theme Example

Example implementation of two color scheme.

- Based on CSS custom properties (variables)
- Use system theme by default
- Browser tab color
- User select
- Store user theme
- Checks user theme on server
- No loading and switch flash

<br>

The scheme colors are defined through css variables in [static/styles/light.css](static/styles/light.css) and [static/styles/dark.css](static/styles/dark.css) files. The base styles are defined by the :global selector.

All executable code in [index.svelte](src/routes/index.svelte)

<br>

## Run this code
For test the example run this command from top level folder (svelte-way):
```bash
npm i
npm run dark-theme
```
<br>

## How does switching work?
By default, both themes are connected. The browser chooses which one to use by looking at the `media` rule `prefers-color-scheme`.

If user switch theme, a theme css file will be added without `media` rules. It will override the styles selected by the browser.

User's choice will be stored in `cookies` and will be use for the next next queries, including `SSR`.

<br>

## How is the state saved?
First, we use the `load` function to check if the user has switched themes. If he did the key `theme` will stored in the `cookies` and we can read it from the `session.user` parameter.

The `theme` value in the cookie checks by [src/hooks.js](src/hooks.js), and puts result into `session`.

If no value is assigned, it will be defaulted to `auto` via the default parameter in the destruction function.

We pass the `theme` value to the `layout`, where it is already bound to a group of radio buttons via `two-way` bindings.

Change the `theme` variable will run the `saveUserTheme` function. It set `theme` cookie through a helper function.

The function has an environment check so that it only runs in the browser.

<br>

## Tabs color
It uses the `theme-color` meta tag. This tells the browser to color the tabs in the target color.
