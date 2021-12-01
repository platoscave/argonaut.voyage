<template>
  <div v-if="readonly" class="ar-readonly-div">
    <div v-for="item in filteredObjs" :key="item._id" :value="item._id">
      <div>{{item.label}}</div>
    </div>
  </div>
  <el-checkbox-group
    v-else-if="items.length < 5"
    v-on:input="$emit('input', $event)"
    v-on:change="$emit('change', $event)"
    :value="value"
  >
    <el-checkbox
      v-for="item in items"
      :key="item._id"
      :label="item.name ? item.name : item.title"
      :value="item._id"
    ></el-checkbox>
  </el-checkbox-group>
  <el-select
    v-else
    class="ar-multiple"
    v-on:input="$emit('input', $event)"
    v-on:change="$emit('change', $event)"
    :value="value"
    multiple
  >
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
import PoucdbServices from "../../../services/pouchdbServices";
import WidgetMixin from "../../../lib/widgetMixin";

export default {
  name: "ar-select-array-query",
  mixins: [WidgetMixin],
  props: {
    value: {
      type: Array,
      default: () => [],
    },
    property: {
      type: Object,
      default: () => {},
    },
    required: Boolean,
    readonly: Boolean,
    hashLevel: Number,
  },
  data() {
    return {
      items: [],
    };
  },

  computed: {

    // Get the objs that have an _id in the value array so we have access to the label
    filteredObjs: function() {
      return this.items.filter((obj) => {
        return this.value.includes(obj._id);
      });
    },

  },

  methods: {

    async propertyHandeler() {
      // Execute the query
      if (this.property && this.property.items.mongoQuery) {
        //this.$pouch.debug.enable('*')
        //console.log(PoucdbServices);
        //debugger;
        this.items = await PoucdbServices.executeQuery(
          this.property.items.mongoQuery,
          { _id: this.selectedObjId }
        );
      }
    },

  },

  watch: {
    // immediate: true doesn't work. Too early. Pouch hasn't been initialized yet
    // Thats why we need both mounted and watch
    property: "propertyHandeler",
  },

  mounted: function() {
    this.propertyHandeler();
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
}

/* checkbox background*/
.el-checkbox-group {
  background-color: #ffffff08;
  padding-left: 10px;
  padding-right: 10px;
  border-radius: 4px;
  border-color: #00adff42;
  border-style: solid;
  border-width: 1px;
  font-size: 16px;
  line-height: 30px;
}

/* Select */
/* .ar-control >>> .el-input > input {
  background-color: #ffffff08;
  border-color: #00adff42;
  font-size: 16px;
  height: 30px;
} */

/* Fix multiselect */
.ar-multiple >>> .el-tag {
  background-color: #ffffff08;
}
.ar-multiple >>> .el-select__tags-text {
  color: #00adff;
}
.ar-multiple >>> .el-icon-close {
  background-color: #ff4000a3;
  color: #eee;
}
</style>
