<script setup lang="ts">
import { ref, watch } from "vue";
import { db, argoQuery } from "~/services/dexieServices";
import useLiveQuery from "~/composables/useLiveQuery";
import { useHashDissect, updateHashWithSelectedTab } from "~/composables/useHashDissect";

const props = defineProps({
  hashLevel: Number,
  viewId: String,
})
const {selectedObjId} = useHashDissect(props.hashLevel)

interface IDataObj {
  _id: string;
  name: string;
}
const dataObj = useLiveQuery<IDataObj>(
  () => db.state.get(selectedObjId.value),
  [selectedObjId]
)

</script>

<template>
RAW
  <!-- <highlight-code lang="json" class="highlight-code">
    {{ dataObj }}
  </highlight-code> -->
</template>


<style scoped>
.highlight-code >>> .hljs{
  background: unset;
  line-height: 20px;
  font-size: 14px;
}
</style>
