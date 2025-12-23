import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.js'),
      name: 'DiyVueComponent',
      fileName: (format) => `diy-vue-component.${format}.js`
    },
    rollupOptions: {
      external: ['vue', 'element-plus', 'md-editor-v3'],
      output: {
        // 为npm环境准备，暂时不需要
        // globals: {
        //   vue: 'Vue',
        //   'element-plus': 'ElementPlus',
        //   'md-editor-v3': 'MdEditor'
        // }
      }
    }
  }
})
