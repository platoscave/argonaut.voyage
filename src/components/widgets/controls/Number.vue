<template>
  <div v-if="readonly" class="ar-readonly-div">
    {{ Number.parseFloat(value).toFixed(precision) }}
  </div>

  <el-input-number
    v-else
    v-on:input="$emit('input', $event)"
    :value="value"
    :min="property.minimum"
    :max="property.maximum"
    :precision="precision"
    controls-position="right"
  >
  </el-input-number>
</template>

<script>
export default {
  name: "ar-number",
  props: {
    value: {
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

<style scoped>
/* Readonly div */
.ar-readonly-div {
  background-color: #ffffff08;
  padding-left: 10px;
  padding-right: 10px;
  border-radius: 4px;
  border-style: none;
  font-size: 16px;
  line-height: 30px;
  min-height: 30px;
  width: 200px;
  text-align: right;
}
.el-input-number--small {
  width: 220px;

}
</style>
