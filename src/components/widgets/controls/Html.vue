<script setup lang="ts">
import { ref, computed } from "vue";

const props = defineProps({
  hashLevel: { type: Number, default: 0 },
  modelValue: { type: String, default: '' },
  property: { type: Object, default: {} },
  readonly: { type: Boolean, default: true },
})

</script>

<template>
  <div v-if="readonly" class="ar-lightgrey-background" v-html="modelValue">

  </div>
  <div v-else>
    <el-input
      type="textarea"
      autosize
      v-on:input="$emit('input', $event)"
      :model-value="modelValue"
    ></el-input>
  </div>
</template>


<style scoped>
</style>
