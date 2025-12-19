import MyButton from './MyButton.vue'
import HelloWorld from './HelloWorld.vue'

// 所有组件数组
const components = [MyButton, HelloWorld]

// 全局注册
const install = (app) => {
  components.forEach(c => app.component(c.name, c))
}

// 支持按需导入
export { MyButton, HelloWorld }
export default { install }
