<script setup lang="ts">
import { ref, watch } from "vue";
import { db, argoQuery } from "~/services/dexieServices";
import useLiveQuery from "~/composables/useLiveQuery";
import { useHashDissect, updateHashWithSelectedTab } from "~/composables/useHashDissect";
import Ajv from "ajv";
import * as draft4MetaSchema from "ajv/lib/refs/json-schema-draft-04.json";

const props = defineProps({
  hashLevel: Number,
  viewId: String,
})
const {selectedObjId, pageId, selectedTab} = useHashDissect(props.hashLevel)
const viewObj = ref({})
const errorObj = ref({})
const formMode = ref("Readonly Dense")
const ajv = new Ajv()

interface IDataObj {
  _id: string;
  name: string;
  classId: string;
}
const dataObj = useLiveQuery<IDataObj>(
  () => db.state.get(selectedObjId.value),
  [selectedObjId]
)
watch(dataObj, async (dataObj) => {
  viewObj.value = await argoQuery.getMergedAncestorProperties(dataObj.classId)

  const validate = ajv.compile(viewObj.value);
  const valid = validate(dataObj);
  if (valid) errorObj.value = ["Valid"];
  else return errorObj.value = validate.errors;
});


</script>

<template>
  <div>
    <h3>Errors</h3>
    <!-- <highlight-code lang="json" class="highlight-code">
      {{ errorObj }}
    </highlight-code>
    <h3>Schema</h3>
    <highlight-code lang="json" class="highlight-code">
      {{ schemaObj }}
    </highlight-code> -->
  </div>
</template>


<style scoped>
.highlight-code >>> .hljs {
  background: unset;
  line-height: 20px;
  font-size: 14px;
}
</style>
