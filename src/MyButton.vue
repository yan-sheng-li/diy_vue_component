<template>
  <el-button :type="type" :size="size" :disabled="disabled" :loading="loading">
    <slot />
  </el-button>
</template>

<script>
import { ElButton } from 'element-plus'

export default {
  name: 'MyButton',
  components: {
    ElButton
  },
  props: {
    type: {
      type: String,
      default: 'primary'
    },
    size: {
      type: String,
      default: 'default'
    },
    disabled: {
      type: Boolean,
      default: false
    },
    loading: {
      type: Boolean,
      default: false
    }
  }
}
</script>

<style scoped>
</style>
