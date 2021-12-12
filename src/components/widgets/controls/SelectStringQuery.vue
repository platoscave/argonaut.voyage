<template>
  <div v-if="readonly" class="ar-readonly-div">
    {{ valueLabel }}
  </div>
  <el-radio-group
    v-else-if="items.length < 5"
    v-on:input="$emit('input', $event)"
    v-on:change="$emit('change', $event)"
    :value="value"
  >
    <el-radio
      v-for="item in items"
      :key="item._id"
      :label="item.label"
      :value="item._id"
    ></el-radio>
  </el-radio-group>
  <el-select
    v-else
    class="ar-select"
    v-on:input="$emit('input', $event)"
    v-on:change="$emit('change', $event)"
    :value="value"
    :clearable="required ? false : true"
  >
    <el-option
      v-for="item in items"
      :key="item._id"
      :label="item.label"
      :value="item._id"
    >
    </el-option>
  </el-select>
</template>

<script>
import { argoQuery } from "../../../services/dexieServices";
import { pluck, switchMap } from "rxjs/operators";
import WidgetMixin from "../../../lib/widgetMixin";

export default {
  name: "ar-select-string-query",
  mixins: [WidgetMixin],
  props: {
    value: {
      type: String,
      default: "",
    },
    property: {
      type: Object,
      default: () => {},
    },
    required: Boolean,
    readonly: Boolean,
    hashLevel: Number,
  },

  subscriptions() {
    // Watch the property as observable
    const property$ = this.$watchAsObservable("property", {
      immediate: true,
    }).pipe(pluck("newValue"));
    // Whenever it changes, reset the live query with the new property
    const items$ = property$.pipe(
      switchMap((property) =>
        argoQuery.executeQuery(property.argoQuery, { _id: this.selectedObjId })
      )
    );
    return {
      items: items$,
    };
  },

  computed: {
    // Get the label for the value
    valueLabel: function() {
      if (!(this.value && this.items)) return "";
      let valueObj = this.items.find((obj) => {
        return obj._id === this.value;
      });
      if (!valueObj) return this.value;
      return valueObj.label;
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
  line-height: 24px;
  min-height: 24px;
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
