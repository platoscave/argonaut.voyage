<script setup lang="ts">
import { ref, computed } from "vue";

const props = defineProps({
  hashLevel: { type: Number, default: 0 },
  modelValue: { type: Number, default: 0 },
  property: { type: Object, default: {} },
  readonly: { type: Boolean, default: true },
});

const precision = computed(() => {
  if (props.property.type === "number") {
    if (props.property.multipleOf) {
      // use the exponent of multipleOf to determin precision
      let exp = String(props.property.multipleOf.toExponential());
      exp = Number(exp.substr(exp.lastIndexOf("e") + 1));
      return Math.abs(exp); // must be positive int
    }
  }
  // integer
  return 0;
});
</script>

<template>
  <div v-if="readonly" class="ar-number-div">
    {{ Number.parseFloat(modelValue).toFixed(precision) }}
  </div>

  <el-input-number
    v-else
    v-on:input="$emit('input', $event)"
    v-on:change="$emit('change', $event)"
    :model-value="modelValue"
    :min="property.minimum"
    :max="property.maximum"
    :precision="precision"
    controls-position="right"
  >
  </el-input-number>
</template>
<!--
<script>
export default {
  name: "ar-number",
  props: {
    modelValue: {
      type: Number,
      default: 0,
    },
    property: {
      type: Object,
      default: () => {},
    },
    readonly: Boolean,
  },
  computed: {
    precision: function () {
      if (this.property.type === "number") {
        if (this.property.multipleOf) {
          // use the exponent of multipleOf to determin precision
          let exp = String(this.property.multipleOf.toExponential());
          exp = Number(exp.substr(exp.lastIndexOf("e") + 1));
          return Math.abs(exp); // must be positive int
        }
      }
      // integer
      return 0;
    },
  },
};
</script>
-->
<style scoped>
/* Readonly div */
.ar-number-div {
  background-color: #ffffff08;
  padding-left: 10px;
  padding-right: 10px;
  border-radius: 4px;
  border-style: none;
  font-size: 16px;
  line-height: 24px;
  min-height: 24px;
  width: 200px;
  /* text-align: right; */
}
.el-input-number {
  width: 220px;
}
</style>
