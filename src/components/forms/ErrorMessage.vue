<script lang="ts" setup>
defineProps({
  inputName: { type: String, required: true },
  errorMessage: { type: String, required: true }
})
</script>

<template v-if="errorMessage">
  <p :id="`errors-${inputName}`" class="error">
    <VIconCustom name="error-fill" />
    {{ errorMessage }}
  </p>
</template>
