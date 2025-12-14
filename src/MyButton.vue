<template>
  <button class="my-btn">
    <slot />
  </button>
</template>

<script>
export default {
  name: 'MyButton'
}
</script>

<style scoped>
.my-btn {
  padding: 8px 16px;
  background: #409eff;
  color: #fff;
  border: none;
  border-radius: 4px;
}
</style>
