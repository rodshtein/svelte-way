`English` [`Русский`](README-RU.md)

# Svelte preprocess config

> English version is still in progress. Ready paragraph is marked by ✓ PR welcome.

## The Problem ✓
Sometimes codelint or parsing is falling when you trying to make it work. This is because by following preprocessor [guides](https://github.com/sveltejs/svelte-preprocess/tree/master/docs) you can split config to many files:
 
- part in **rollup.config.js**,
- part in **postcss.config.js**,
- and lint config in **svelte.config.js**.

This can confuse. Therefore a good point to keep the whole config in one place for all tools. By using this pattern, you minimize the chance to make a mistake.

## How does all this magic work?
### Parsing

[Svelte-preprocess](https://github.com/sveltejs/svelte-preprocess) has several config patterns. The most practical is to make two files:

- store the main preprocessor config in **svelte.config.js**,
- store the postcss config (if we use it) in  **postcss.config.js**. 

You need to set the main config in [svelte-preprocess](https://github.com/sveltejs/svelte-preprocess). Then parser will try to find:
- key: `postcss: true`, 
- or a key with a postcss config,
- or attributes `type/lang = postcss` in svelte files,

and if it found them but **didn't find loaded postcss plugins**, it will search for **postcss.config.js** in the root path, then it will use founded config, and **ignore** config from the first file.

[Svelte-preprocess](https://github.com/sveltejs/svelte-preprocess) [requires](https://github.com/michael-ciniawsky/postcss-load-config) requires all plugins itself from postcss.config.js. This means you must install all dependencies, if you forgot something, you'll see an error in the console.

[Svelte-preprocess](https://github.com/sveltejs/svelte-preprocess) defines syntax by type/lang attributes or use default config you can change it.

### Linting

For linting, you need the [Sveltejs Language Tools](https://github.com/sveltejs/language-tools) extension. The extension defines the syntax by same **type/lang** attributes. If you don't use default syntax (js, css, html), you need to add the attributes so that the linter understands which rules to apply.

Then linter will look for config in the **svelte.config.js** file. If it has a **postcss key** with a config object, it uses it. If it has the key value postcss: true, it will try to find the **postcss.config.js** file in the root path, and take the config from there.


### Сonclusion

In addition, you can add part of the config directly in **rollup.config.js**, but you still need two other files for linting. As you can see, there are a lot of pieces, it's confusing and you'll make many fails.

It's all f\***ng

<img src="magic.gif">

## Decision

[Sveltejs Language Tools](https://github.com/sveltejs/language-tools) uses the **svelte.config.js** file to check the syntax - in which we will store the entire config, [_see below_](#svelteconfigjs). The main difference is that earlier we stored the postcss config in a separate file, and the parser with the linter make require for all dependencies by it is. Now we have to load the dependencies ourselves - no magic, but clearly.

Our config exports an object with two functions: 
- first is needed for the linter,
- second - we will require in rollup config, where, depending on the environment (isDev), it will return the required build configuration.

After editing the config, restart the linter: 
- ctrl/cmd-shift-p, 
- enter svelte restart, 
- select Svelte: Restart Language Server.

Now, our config is in one place, we decide which plugins to request and are sure that the parser and linter use the same configuration.

> **Important note**<br/>
> We still can add the postcss config as a separate file. To make it work, you need to write `postcss: true` in **svelte.config.js**, then all tools will look for **postcss.config.js** in the root path. If the [config syntax](https://github.com/michael-ciniawsky/postcss-load-config#postcssrcjs-or-postcssconfigjs) is correct, then the dependencies will be loaded automatically. You also need to pass the environment variable to configure the build. As a result, we will again with "magic" config stored in different files.

### svelte.config.js
```
const sveltePreprocess = require('svelte-preprocess');
const easyImport = require('postcss-easy-import');
const mixins = require('postcss-mixins');
const nested = require('postcss-nested');
const presetEnv = require('postcss-preset-env');
const sugarss = require('sugarss');


function getSP(isDev = false) {
  return sveltePreprocess({
    sourceMap: isDev,
    pug: true,
    postcss: {
      map: isDev,
      parser: sugarss,
      plugins: [
        easyImport(),
        mixins(),
        nested(),
        presetEnv({
          browsers: "last 2 versions",
          stage: 0,
          features: {
            "nesting-rules": true,
          },
        }),
      ],
    },
  });
}

module.exports = {
    preprocess: getSP(true),
    getSP,
};
```
### rollup.config.js (sapper example)
The changes are marked 👈
```
// sapper def
import resolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import commonjs from '@rollup/plugin-commonjs';
import svelte from 'rollup-plugin-svelte';
import babel from '@rollup/plugin-babel';
import { terser } from 'rollup-plugin-terser';
import config from 'sapper/config/rollup.js';
import pkg from './package.json';

const sveltePreprocess = require('./svelte.config').getSP;  // 👈

const mode = process.env.NODE_ENV;
const dev = mode === 'development';
const legacy = !!process.env.SAPPER_LEGACY_BUILD;

const onwarn = (warning, onwarn) =>
  (warning.code === 'MISSING_EXPORT' && /'preload'/.test(warning.message)) ||
  (warning.code === 'CIRCULAR_DEPENDENCY' && /[/\\]@sapper[/\\]/.test(warning.message)) ||
  onwarn(warning);

export default {
  client: {
    input: config.client.input(),
    output: config.client.output(),
    plugins: [
      replace({
        'process.browser': true,
        'process.env.NODE_ENV': JSON.stringify(mode)
      }),
      svelte({
        preprocess: sveltePreprocess(dev),  // 👈
        dev,
        hydratable: true,
        emitCss: true
      }),
      resolve({
        browser: true,
        dedupe: ['svelte']
      }),
      commonjs(),

      legacy && babel({
        extensions: ['.js', '.mjs', '.html', '.svelte'],
        babelHelpers: 'runtime',
        exclude: ['node_modules/@babel/**'],
        presets: [
          ['@babel/preset-env', {
            targets: '> 0.25%, not dead'
          }]
        ],
        plugins: [
          '@babel/plugin-syntax-dynamic-import',
          ['@babel/plugin-transform-runtime', {
            useESModules: true
          }]
        ]
      }),

      !dev && terser({
        module: true
      })
    ],

    preserveEntrySignatures: false,
    onwarn,
  },

  server: {
    input: config.server.input(),
    output: config.server.output(),
    plugins: [
      replace({
        'process.browser': false,
        'process.env.NODE_ENV': JSON.stringify(mode)
      }),
      svelte({
        preprocess: sveltePreprocess(dev),  // 👈
        generate: 'ssr',
        hydratable: true,
        dev
      }),
      resolve({
        dedupe: ['svelte']
      }),
      commonjs()
    ],
    external: Object.keys(pkg.dependencies).concat(require('module').builtinModules),

    preserveEntrySignatures: 'strict',
    onwarn,
  },

  serviceworker: {
    input: config.serviceworker.input(),
    output: config.serviceworker.output(),
    plugins: [
      resolve(),
      replace({
        'process.browser': true,
        'process.env.NODE_ENV': JSON.stringify(mode)
      }),
      commonjs(),
      !dev && terser()
    ],

    preserveEntrySignatures: false,
    onwarn,
  }
};

```
