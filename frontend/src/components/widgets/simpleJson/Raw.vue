<script setup lang="ts">
import { ref, computed } from "vue";
import { db } from "~/services/dexieServices";
import useLiveQuery from "~/composables/useLiveQuery";
import { useHashDissect} from "~/composables/useHashDissect";
import { lowlight } from "lowlight/lib/core.js";
import { toHtml } from "hast-util-to-html";


const props = defineProps({
  hashLevel: Number,
  viewId: String,
})
const { selectedObjId } = useHashDissect(props.hashLevel);

const dataObj = useLiveQuery(
  () => db.state.get(selectedObjId.value),
  [selectedObjId]
)
const highlightedCode = computed(() => {
  if (dataObj.value) {
    const res = lowlight.highlightAuto(JSON.stringify(dataObj.value, null, 2));
    return toHtml(res);
  }
  return "";
});
</script>

<template>
  <code>
    <pre v-html="highlightedCode" />
  </code>
</template>

<style scoped>

</style>
