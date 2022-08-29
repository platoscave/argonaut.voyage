<script setup lang="ts">
const props = defineProps({
  modelValue: { type: String, default: "" },
  readonly: { type: Boolean, default: true },
});
</script>

<template>
  <div v-if="readonly" class="ar-lightgrey-background">
    {{ modelValue }}
  </div>
  <!-- TODO type="textarea" -->
  <el-input
    v-else
    autosize
    v-model="modelValue"
    @input="$emit('update:modelValue', $event)"
    @change="$emit('change', $event)"
  ></el-input>
</template>
