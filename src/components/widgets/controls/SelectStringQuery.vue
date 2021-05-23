<template>
  <div
    v-if="readonly || items.length < 2"
    class="ar-readonly-div"
  >
    {{ dataObj ? (dataObj.name ? dataObj.name : dataObj.title) : "" }}
  </div>
  <el-radio-group
    v-else-if="items.length < 5"
    v-on:input="$emit('input', $event)"
    :value="value"
  >
    <el-radio
      v-for="item in items"
      :key="item._id"
      :label="item.name ? item.name : item.title"
      :value="item._id"
    ></el-radio>
  </el-radio-group>
  <el-select v-else class="ar-select" v-on:input="$emit('input', $event)" :value="value">
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
import  PoucdbServices from "../../../dataServices/pouchdbServices";
import WidgetMixin from "../../../lib/widgetMixin";

export default {
  name: "ar-select-string-query",
  mixins: [WidgetMixin],
  props: {
    value: {
      type: String,
      default: '',
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
        //console.log(PoucdbServices);
        //debugger;
        this.items = await PoucdbServices.executeQuery(
          this.property.mongoQuery,
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
  mounted: function () {
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

/* help!!! cant get the blue border to come back */
/* div.el-select > div > input {
  background-color: #ffffff08;
  border-color: #00adff42;
  border-style: solid;
  font-size: 16px;
  height: 30px;
}
input[readonly] {
  border-style: solid;
} */
</style>
