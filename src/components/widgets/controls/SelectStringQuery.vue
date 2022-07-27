<script setup lang="ts">
import { ref, computed } from "vue";
import useArgoQuery from "~/composables/useArgoQuery";
import { useHashDissect } from "~/composables/useHashDissect";

const props = defineProps({
  hashLevel: { type: Number, default: 0 },
  modelValue: { type: String, default: '' },
  property: { type: Object, default: {} },
  readonly: { type: Boolean, default: true },
  requiered: { type: Boolean, default: false },
})

const { selectedObjId } = useHashDissect(props.hashLevel);

const items = useArgoQuery(
  props.property.argoQuery,
  {_id: selectedObjId.value},
  [props.property, selectedObjId]
)

const valueLabel = computed(() => {
  if (!(props.modelValue && items.value)) return "";
  let valueObj = items.value.find(obj => {
    return obj._id === props.modelValue;
  })

  if (!valueObj) return props.modelValue;
  return valueObj.title ? valueObj.title : valueObj.name;
});
</script>

<template>
  <div v-if="items">
    <div v-if="readonly" class="ar-lightgrey-background">
      {{ valueLabel }}
    </div>
    <el-radio-group
      v-else-if="items.length < 5"
      v-on:input="$emit('input', $event)"
      v-on:change="$emit('change', $event)"
      :model-value="modelValue"
    >
      <el-radio
        v-for="item in items"
        :key="item._id"
        :label="item.title ? item.title : item.name"
        :model-value="item._id"
      ></el-radio>
    </el-radio-group>
    <el-select
      v-else
      class="ar-select"
      v-on:input="$emit('input', $event)"
      v-on:change="$emit('change', $event)"
      :model-value="modelValue"
      :clearable="required ? false : true"
    >
      <el-option
        v-for="item in items"
        :key="item._id"
        :label="item.title ? item.title : item.name"
        :model-value="item._id"
      >
      </el-option>
    </el-select>
  </div>
</template>
<!--
<script>
import { argoQuery } from "../../../services/dexieServices";
import {
  pluck,
  switchMap,
  map,
  filter,
  distinctUntilChanged,
  defaultIfEmpty,
} from "rxjs/operators";
import WidgetMixin from "../../../lib/widgetMixin";

export default {
  name: "ar-select-string-query",
  mixins: [WidgetMixin],
  props: {
    modelValue: {
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
  data() {
    return {
      items: [],
    };
  },

  subscriptions() {
    //
    // Watch the selectedObjId as observable
    const property$ = this.$watchAsObservable("property", {
      immediate: true,
      deep: true,
    })
      .pipe(pluck("newValue")) // Obtain modelValue from reactive var (whenever it changes)
      .pipe(filter((property) => property && property.argoQuery)) //filter out falsy values
      .pipe(distinctUntilChanged()); // emit only when changed

    // Whenever selectedObjId changes, reset the live query with the new selectedObjId
    const items$ = property$.pipe(
      switchMap((property) =>
        argoQuery.executeQuery(property.argoQuery, {
          _id: this.selectedObjId,
        })
      )
    );

    //items$.pipe(defaultIfEmpty([]));

    return {
      items: items$,
    };
  },

  computed: {
    // Get the label for the modelValue
    valueLabel: function() {
      if (!(this.modelValue && this.items)) return "";
      let valueObj = this.items.find((obj) => {
        return obj._id === this.modelValue;
      });
      if (!valueObj) return this.modelValue;
      return valueObj.title ? valueObj.title : valueObj.name;
    },
  },
};
</script>
-->
<style scoped>
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
