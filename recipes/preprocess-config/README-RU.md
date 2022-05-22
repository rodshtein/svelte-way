[`🇺🇸 English`](README.md) `🇷🇺 Русский`

# Svelte preprocess config

## Проблема
Часто бывает, что начинает глючить подсветка кода, или с подсветкой всё ок, но сборка падает. 
Всё потому, что следуя [гайду](https://github.com/sveltejs/svelte-preprocess/tree/master/docs) препроцессора, мы можем разбить конфиг на несколько фалов: 
- часть в **rollup.config.js**,
- часть в **postcss.config.js**,
- и конфиг для линтинга в **svelte.config.js**.

Это может сильно запутать. Поэтому хороший паттерн хранить конфиг в одном месте, так, чтобы все инструменты имели к нему доступ. 
С такой тактикой мы будем править конфиг один раз сводя вероятность ошибки к минимуму.

## А как вообще работает вся эта магия? 
### Парсинг

У [svelte-preprocess](https://github.com/sveltejs/svelte-preprocess) есть несколько тактик настройки, самая практичная сделать два файла: 
- в **svelte.config.js** хранить основной конфиг препроцессора,
- в **postcss.config.js** хранить postcss конфиг _(если мы его используем)_. 

В [svelte-preprocess](https://github.com/sveltejs/svelte-preprocess) нужно передать файл с основным конфигом. Если парсер найдет в нём:
- ключ **postcss: true**, 
- или ключ с конфигом postcss,
- или атрибуты **type/lang = postcss** в svelte-файлах,

и не найдёт **загруженных** postcss плагинов, то он будет искать **postcss.config.js** в корне проекта, использует его конфиг, а конфиг из первого файла — **проигнорирует**. 

[Svelte-preprocess](https://github.com/sveltejs/svelte-preprocess) сам [загружает](https://github.com/michael-ciniawsky/postcss-load-config) все необходимые плагины из **postcss.config.js**. Это значит, что все зависимости должны быть установлены, если мы что-то забыли, то увидим ошибку в консоли. 

[Svelte-preprocess](https://github.com/sveltejs/svelte-preprocess) определяет синтаксис глядя на атрибуты **type/lang** или использует дефолтные настройки, [которые можно поменять](https://github.com/sveltejs/svelte-preprocess/blob/master/docs/preprocessing.md#auto-preprocessing).

### Линтинг

Для работы линтера нужно расширение [Sveltejs Language Tools](https://github.com/sveltejs/language-tools). Расширение определяет синтаксис глядя на те же атрибуты **type/lang**. Если мы используем отличный от дефолтного (js, css, html) синтаксис, нам нужно использовать эти атрибуты, чтобы линтер понимал какие правила применять. 

Определив синтаксис, линтер будет искать его конфиг в файле **svelte.config.js**. Если он встретит ключ **postcss** с объектом конфига и загруженными плагинами, то будет использывать его. Если плагины не загружены или ключ **postcss** имеет булевое значение **true**, то линтер попытается найти файл **postcss.config.js** в корне проекта, и взять конфиг оттуда.


### Что в итоге

Вдобавок, мы можем хранить часть конфига прямо в **rollup.config.js**, но нам всё равно нужны два других файла для линтинга. Как видите здесь много условностей из-за которых можно сильно запутаться и наш конфиг будет работать не так как хотелось. 

Всё это грёбаная

<img src="magic.gif">

## Решение
[Sveltejs Language Tools](https://github.com/sveltejs/language-tools) для проверки синтаксиса использует файл **svelte.config.js** — в нём мы будем хранить весь конфиг [_см. ниже_](#svelteconfigjs). Основное отличие в том, что раньше мы хранили postcss конфиг в отдельном файле, в виде простого объекта, а парсер с линтером сами загружали зависимости. Теперть нам придётся загружать зависимости самостоятельно — никакой магии, зато наглядно. 

Наш конфиг экспортирует объект с двумя функциями: 
- первая нужна для работы линтера,
- вторую мы передадим в конфиг роллапа, где в зависимости от окружения (isDev) она вернёт нужную конфигурацию сборки.

После правки конфига перезапустим линтер: 
- ctrl/cmd-shift-p, 
- введите svelte restart, 
- выберите Svelte: Restart Language Server.

Теперь, наш конфиг в одном месте, мы контролируем загрузку плагинов и уверены, что парсер с линтером используют единую конфигурацию.

> **Важное замечение**<br/>
> Мы всё ещё можем добавить postcss конфиг отдельным файлом. Чтобы он заработал нужно в **svelte.config.js** прописать `postcss: true`, тогда все инструменты будут искать **postcss.config.js** в корне проекта. Если [синтаксис конфига](https://github.com/michael-ciniawsky/postcss-load-config#postcssrcjs-or-postcssconfigjs) правильный, то зависимости загрузятся автоматически. Ещё нужно отдельно прокинуть переменную окружения для настройки сборки. В итоге мы опять получим «магический» конфиг разбросанный по разным файлам.

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
Так отмечены изменения 👈
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
