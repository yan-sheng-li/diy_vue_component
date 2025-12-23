// 组件库入口文件
import MyButton from './MyButton.vue'
import HelloWorld from './HelloWorld.vue'
import CrudTable from './CrudTable.vue'
import MapPicker from './MapPicker.vue'

// 所有组件数组
const components = [MyButton, HelloWorld, CrudTable, MapPicker]

// 全局注册
const install = (app) => {
  components.forEach(c => app.component(c.name, c))
}

// 支持按需导入
export { MyButton, HelloWorld, CrudTable, MapPicker }
export default { install }
