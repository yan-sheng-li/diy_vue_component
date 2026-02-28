# 自定义组件库

## 组件列表

- `MyButton` - 自定义按钮组件
- `HelloWorld` - 示例组件
- `CrudTable` - CRUD 表格组件（支持搜索、新增、编辑、删除、分页）
- `MapPicker` - 地图选点组件（基于高德地图）

## 打包发布
```bash
npm run build
```
```bash
npm version patch   # 例如 1.0.2
```
```bash
npm publish
```

## 使用方
在项目根目录下创建`.npmrc`，内容如下：
```text
registry=https://registry.npmmirror.com/
@yan-sheng-li:registry=https://npm.pkg.github.com
```

下载包
```bash
npm install @yan-sheng-li/diy_vue_component@latest
```
在 `main.js` 里面全局注册组件
```js
import {CrudTable} from '@yan-sheng-li/diy_vue_component'

const app = createApp(App)

app.component('CrudTable', CrudTable) // 全局注册 CrudTable 组件
```

或者按需导入
```js
import {HelloWorld} from '@yan-sheng-li/diy_vue_component'
```

然后在项目任意页面就可以使用组件了，如：
```vue
<HelloWorld name="张三" />
```

## CrudTable 组件使用示例

### 基础用法
```vue
<template>
  <CrudTable :config="config" :api="api" />
</template>

<script setup>
import { CrudTable } from '@yan-sheng-li/diy_vue_component'

const config = {
  // 配置项...
}

const api = {
  list: (params) => { /* 获取列表 */ },
  create: (data) => { /* 创建 */ },
  update: (data) => { /* 更新 */ },
  delete: (id) => { /* 删除 */ }
}
</script>
```

### 地图选点字段配置

如果表单中包含地址类型字段，需要配置高德地图 Key：

```vue
<template>
  <CrudTable :config="config" :api="api" />
</template>

<script setup>
import { CrudTable } from '@yan-sheng-li/diy_vue_component'

const config = {
  // 全局高德地图 Key（推荐在 config 中统一配置）
  amapKey: '你的高德地图 Key',
  
  formFields: [
    {
      prop: 'address',
      label: '地址',
      type: 'map',
      // 也可以单独在字段上配置 amapKey
      // amapKey: '你的高德地图 Key',
      required: true
    }
  ]
  // ...其他配置
}
</script>
```

### 如何获取高德地图 Key

1. 访问 [高德地图开放平台](https://console.amap.com/)
2. 注册/登录账号
3. 创建应用，选择 Web 端（JS API）
4. 获取 Key 并在 config 中配置
