<template>
  <div v-if="readonly || items.length < 2" class="ar-rodiv">
    {{ dataObj ? (dataObj.name ? dataObj.name : dataObj.title) : "" }}
  </div>
  <el-radio-group
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
import { PoucdbServices } from "../../../dataServices/pouchdbServices.js";
import WidgetMixin from "../../../lib/widgetMixin";

export default {
  name: "ar-select",
  mixins: [WidgetMixin],
  props: {
    property: Object,
    value: String,
    readonly: Boolean,
    required: Boolean,
    hashLevel: Number
  },
  data() {
    return {
      items: [],
    };
  },

  pouch: {
    dataObj: function () {
      if (this.value) {
        return {
          database: "blockprocess",
          selector: { _id: this.value },
          first: true,
        };
      } else return "";
    },
  },
  methods: {
    async propertyHandeler() {
      // Execute the query
      if (this.property && this.property.mongoQuery) {
        //this.$pouch.debug.enable('*')
        console.log(PoucdbServices)
        debugger
        this.items = await PoucdbServices.executeQuery(this.property.mongoQuery, { _id: this.selectedObjId});
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
