import adapter from '@sveltejs/adapter-auto';

const dir = process.env.APP_DIR;

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter(),
		files: {
      assets: `recipes/${dir}/static`,
      hooks: `recipes/${dir}/src/hooks`,
      lib: `recipes/${dir}/src/lib`,
      routes: `recipes/${dir}/src/routes`,
      serviceWorker: `recipes/${dir}/src/service-worker`,
      template: `recipes/${dir}/src/app.html`
    },
	}
};

export default config;
