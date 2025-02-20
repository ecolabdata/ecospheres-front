import vue from '@vitejs/plugin-vue'
import { readFileSync } from 'fs'
import { load } from 'js-yaml'
import { fileURLToPath, URL } from 'node:url'
import { resolve } from 'path'
import ViteYaml from 'unplugin-yaml/vite'
import { defineConfig, loadEnv } from 'vite'
import dynamicImport from 'vite-plugin-dynamic-import'
import { createHtmlPlugin } from 'vite-plugin-html'
import vueDevTools from 'vite-plugin-vue-devtools'

import {
  vueDsfrAutoimportPreset,
  vueDsfrComponentResolver
} from '@gouvminint/vue-dsfr/meta'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'

interface Config {
  website: {
    title: string
  }
  robots: {
    meta: string
  }
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const configDir = `./configs/${env.VITE_SITE_ID}`
  const configFileUrl = new URL(`${configDir}/config.yaml`, import.meta.url)
  const config = load(readFileSync(configFileUrl, 'utf-8')) as Config
  return {
    base: '/',
    plugins: [
      vueDevTools(),
      vue(),
      AutoImport({
        include: [/\.[tj]sx?$/, /\.vue$/, /\.vue\?vue/],
        imports: [
          // @ts-expect-error TS2322
          'vue',
          // @ts-expect-error TS2322
          'vue-router',
          // @ts-expect-error TS2322
          'vitest',
          // @ts-expect-error TS2322
          vueDsfrAutoimportPreset // Autoimport des composables de VueDsfr
        ],
        vueTemplate: true,
        dts: './src/auto-imports.d.ts',
        eslintrc: {
          enabled: true,
          filepath: './eslintrc-auto-import.mjs',
          globalsPropValue: true
        }
      }),
      // Autoimport des composants utilisés dans les templates
      Components({
        dirs: ['src/components', 'src/custom/**/components'], // Autoimport des composants
        deep: true,
        include: [/\.vue$/, /\.vue\?vue/],
        dts: './src/components.d.ts',
        resolvers: [
          vueDsfrComponentResolver // Autoimport des composants de VueDsfr dans les templates
        ]
      }),
      ViteYaml(),
      createHtmlPlugin({
        minify: true,
        inject: {
          data: {
            title: config.website.title,
            metaRobots: config.robots.meta
          }
        }
      }),
      dynamicImport({
        onFiles(files, id) {
          // include only the current site routes definition in the bundle
          if (id.includes('/src/router/index.ts')) {
            return files.filter((routeFile) =>
              routeFile.includes(`custom/${env.VITE_SITE_ID}/routes.ts`)
            )
          }
        }
      })
    ],
    resolve: {
      alias: {
        '@root': resolve(__dirname, './'),
        '@siteConfig': fileURLToPath(new URL(configDir, import.meta.url)),
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        vue: 'vue/dist/vue.esm-bundler.js'
      }
    },
    test: {
      environment: 'happy-dom',
      globals: true
    },
    server: {
      // this is a dev CSP, restricting outbound requests to *.data.gouv.fr
      // this makes sure we don't make unintended API calls to third-parties (looking at you iconify)
      // ⚠️ this won't be applied on prod or other environments
      headers: {
        'Content-Security-Policy': [
          "connect-src 'self' *.data.gouv.fr raw.githubusercontent.com"
        ].join('; ')
      }
    }
  }
})
