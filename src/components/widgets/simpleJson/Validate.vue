<script setup lang="ts">
import { ref, watch } from "vue";
import Ajv from "ajv";
import { db, argoQuery } from "~/services/dexieServices";
import useLiveQuery from "~/composables/useLiveQuery";
import { useHashDissect } from "~/composables/useHashDissect";
import { lowlight } from "lowlight/lib/core.js";
import { toHtml } from "hast-util-to-html";

const props = defineProps({
  hashLevel: Number,
  viewId: String,
});
const { selectedObjId } = useHashDissect(props.hashLevel);
const highlightedCode = ref("");
const highlightedErrors = ref("");
const ajv = new Ajv({ allErrors: true, strict: false, schemaId: "auto" });

interface IDataObj {
  _id: string;
  classId: string;
}
const dataObj = useLiveQuery<IDataObj>(
  () => db.state.get(selectedObjId.value),
  [selectedObjId]
);

watch(dataObj, (dataObj) => {
  argoQuery.getMergedAncestorProperties(dataObj.classId).then((schemaObj) => {
    highlightedCode.value = toHtml(
      lowlight.highlightAuto(JSON.stringify(schemaObj, null, 2))
    );

    const validate = ajv.compile(schemaObj);
    const valid = validate(dataObj);
    highlightedErrors.value = toHtml(
      lowlight.highlightAuto(JSON.stringify({ erorrs: validate.errors}, null, 2))
    );

  });
});
</script>

<template>
  <div>
    <h3>Errors</h3>
    <code>
      <pre v-html="highlightedErrors" />
    </code>
    <h3>Class Schema</h3>
    <code>
      <pre v-html="highlightedCode" />
    </code>
  </div>
</template>

<style scoped>

</style>
