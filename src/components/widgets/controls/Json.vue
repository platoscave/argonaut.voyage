<template>
  <div v-if="readonly">
    <highlight-code lang="json" class="ar-lightgrey-background">
      {{ value }}
    </highlight-code>
  </div>
  <div v-else>
    <el-input
      type="textarea"
      autosize
      v-on:input="$emit('input', $event)"
      :value="JSON.stringify(value, null, 2)"
    ></el-input>
  </div>
</template>

<script>

export default {
  name: "ar-json",
  props: {
    value: {
      type: Object,
      default: () => {},
    },
    property: {
      type: Object,
      default: () => {},
    },
    readonly: Boolean,
  },
  mounted() {
    console.log(this.value);
  },
};
</script>

<style scoped>
.ar-lightgrey-background >>> .hljs {
  background: unset;
  line-height: 20px;
  font-size: 14px;
  padding: 0px;
}
.ar-control > pre.ar-lightgrey-background {
  margin: 0px
}
</style>
