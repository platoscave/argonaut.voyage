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
  <!-- TODO type="textarea" 
    @input="$emit('update:modelValue', $event)"
  
  -->
  <el-input v-else autosize v-model="modelValue" @change="$emit('update:modelValue', $event)"></el-input>
</template>
