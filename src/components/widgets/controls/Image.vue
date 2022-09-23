<script setup lang="ts">
import { ref, computed } from "vue";

const props = defineProps({
  hashLevel: { type: Number, default: 0 },
  modelValue: { type: String, default: "" },
  property: { type: Object, default: {} },
  readonly: { type: Boolean, default: true },
  // we need to add these to prevent vue warn, for some reason
  class: { type: String, default: "" },
  required: { type: Boolean, default: false },
  formMode: { type: String, default: "" },
});

const emit = defineEmits(["update:modelValue"]);
</script>

<template>

  <img :src="'icons/'+modelValue" class="ar-lightgrey-background" height="24" width="40" />

  <div v-if="!readonly" class="ar-full-width">
    <el-input
      class="ar-control"
      :value="modelValue"
      @input="$emit('update:modelValue', $event)"
    ></el-input>
  </div>
</template>

<style scoped>
.ar-full-width {
  width: 100%;
}
img {
  height: 24px;
  width: 24px;
  border-radius: 25%;
}
</style>
