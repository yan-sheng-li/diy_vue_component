// index.js
import MyButton from './MyButton.vue'
import HelloWorld from './HelloWorld.vue'
import CrudTable from './CrudTable.vue'
import MapPicker from './MapPicker.vue'

const components = [MyButton, HelloWorld, CrudTable, MapPicker]

const install = (app) => {
  components.forEach(c => {
    const comp = c.__esModule ? c.default : c
    if (comp.name) {
      app.component(comp.name, comp)
    }
  })
}

// 支持按需导入
export { MyButton, HelloWorld, CrudTable, MapPicker }
export default { install }
