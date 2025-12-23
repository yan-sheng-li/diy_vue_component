# 自定义组件封装

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
在`main.js`里面全局注册组件
```js
import DiyVueComponent from '@yan-sheng-li/diy_vue_component'

const app = createApp(App)

app.use(DiyVueComponent)
```

或者按需导入
```js
import {HelloWorld} from '@yan-sheng-li/diy_vue_component'
```

然后在项目任意页面就可以使用组件了，如：
```vue
<HelloWorld name="张三" />
```

