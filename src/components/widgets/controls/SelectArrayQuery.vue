<script setup lang="ts">
import { ref, computed } from "vue";

const props = defineProps({
  value: Object,
  property: Object,
  readonly: Boolean,
});

const highlightedCode = computed(() => {

});
</script>


<template>
  <div v-if="readonly" class="ar-lightgrey-background">
    <div v-for="item in filteredObjs" :key="item._id" :value="item._id">
      <div>{{ item.title ? item.title : item.name }}</div>
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
      :label="item.title ? item.title : item.name"
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
      :label="item.title ? item.title : item.name"
      :value="item._id"
    >
    </el-option>
  </el-select>
</template>
<!--
<script>
import { argoQuery } from "../../../services/dexieServices";
import { pluck, switchMap, filter, distinctUntilChanged, defaultIfEmpty } from "rxjs/operators";
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
      items: []
    }
  },

  subscriptions() {
    //
    // Watch the selectedObjId as observable
    const property$ = this.$watchAsObservable("property", {
      immediate: true,
      deep: true
    })
      .pipe(pluck("newValue")) // Obtain value from reactive var (whenever it changes)
      .pipe(filter((property) => (property && property.items && property.items.argoQuery))) //filter out falsy values
      .pipe(distinctUntilChanged()); // emit only when changed

    // Whenever selectedObjId changes, reset the live query with the new selectedObjId
    const items$ = property$.pipe(
      switchMap((property) =>
        argoQuery.executeQuery(property.items.argoQuery, {
          _id: this.selectedObjId,
        })
      )
    );

    items$.pipe(defaultIfEmpty([]))

    return {
      items: items$
    }
  },

  computed: {
    // Get the objs that have an _id in the value array so we have access to the label
    filteredObjs: function() {
      if (!(this.value && this.items)) return "";
      return this.items.filter((obj) => {
        return this.value.includes(obj._id);
      });
    },
  },

};
</script>
-->
<style scoped>

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
  line-height: 24px;
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
