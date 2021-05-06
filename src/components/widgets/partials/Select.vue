<template>
  <div v-if="readOnly || items.length < 2" class="control-background" readonly="readonly">
    {{ dataObj ? (dataObj.name ? dataObj.name : dataObj.title) : '' }}
  </div>
  <el-radio-group
   class="control-background"
    v-else-if="items.length < 5"
    v-on:update="$emit('input', $event)"
    v-bind:value="value"
  >
    <el-radio
      v-for="item in items"
      :key="item._id"
      :label="item.name ? item.name : item.title"
      :value="item._id"
    ></el-radio>
  </el-radio-group>
  <el-select v-else v-on:update="$emit('input', $event)" v-bind:value="value">
    <el-option
      v-for="item in items"
      :key="item._id"
      :label="item.name ? item.name : item.title"
      :value="item._id"
    >
    </el-option>
  </el-select>
</template>

<script>
import QueryMixin from "../../../lib/queryMixin";
import { PouchdbServices } from "../../../dataServices/pouchdbServices";

export default {
  name: "ar-select",
  mixins: [QueryMixin],
  props: {
    property: Object,
    value: String,
    readOnly: Boolean,
  },
  data() {
    return {
      items: [],
    };
  },

  pouch: {
    dataObj: function () {
      if(this.value) {
        return {
          database: "argonaut",
          selector: { _id: this.value },
          first: true,
        };
      } else return ''
    },
  },
  methods: {
    async propertyHandeler() {
      // Execute the query
      if (this.property && this.property.mongoQuery) {
        this.items = await this.getTheData(this.property.mongoQuery);
      }
    },
  },
  watch: {
    // immediate: true doesn't work. Too early. Pouch hasn't been initialized yet
    // Thats why we need both mounted and watch
    property: "propertyHandeler",
  },
  mounted: function () {
    this.propertyHandeler();
  },
};
</script>

<style scoped>
</style>
