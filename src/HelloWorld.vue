<template>
  <div class="hello">
    <h3>你好，{{ name }} 👋</h3>
    <button @click="count++">
      点击次数：{{ count }}
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue'

import { defineComponent } from 'vue'

defineComponent({
  name: 'HelloWorld'
})

// 接收父组件传递的参数（props）
defineProps({
  name: {
    type: String,
    default: 'Vue3'
  }
})

// 组件内部状态
const count = ref(0)
</script>

<style scoped>
.hello {
  border: 1px solid #ddd;
  padding: 10px;
}
</style>
