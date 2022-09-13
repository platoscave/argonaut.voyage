<script setup lang="ts">
import { computed } from "vue";
const props = defineProps({
  modelValue: { type: String, default: "" },
  readonly: { type: Boolean, default: true },
});
const locale = window.navigator.userLanguage || window.navigator.language;


const localeDate = computed(() => {
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
  const date = (new Date(props.modelValue)).toLocaleDateString(locale, options);
  return date
});
</script>

<template>
  <div v-if="readonly" class="ar-lightgrey-background">
    {{ localeDate }}
  </div>
  <!-- TODO small -->
  <ElDatePicker
    v-else
    autosize
    v-model="modelValue"
    @change="$emit('update:modelValue', $event)"
  ></ElDatePicker>
</template>
