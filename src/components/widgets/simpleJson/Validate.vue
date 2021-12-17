<template>
  <highlight-code lang="json" class="highlight-code">
    {{ errorObj }}
  </highlight-code>
</template>

<script>
import { db, argoQuery } from "../../../services/dexieServices";
import { liveQuery } from "dexie";
import { pluck, switchMap, filter, distinctUntilChanged } from "rxjs/operators";
import WidgetMixin from "../../../lib/widgetMixin";
import Ajv from "ajv";
import * as draft4MetaSchema from "ajv/lib/refs/json-schema-draft-04.json";

const ajv = new Ajv({ allErrors: true, schemaId: "auto" }); // or "auto" if you use both draft-04 and draft-06/07 schemas
ajv.addMetaSchema(draft4MetaSchema);

export default {
  name: "ar-validate",
  mixins: [WidgetMixin],
  props: {
    hashLevel: Number,
    viewId: String,
  },
  data() {
    return {
      errorObj: {},
    };
  },

  subscriptions() {
    //
    // Watch the selectedObjId as observable
    const selectedObjId$ = this.$watchAsObservable("selectedObjId", {
      immediate: true,
    })
      .pipe(pluck("newValue")) // Obtain value from reactive var (whenever it changes)
      .pipe(filter((selectedObjId) => selectedObjId)) //filter out falsy values
      .pipe(distinctUntilChanged()); // emit only when changed

    // Whenever selectedObjId changes, reset the live query with the new selectedObjId
    const dataObj$ = selectedObjId$.pipe(
      switchMap((selectedObjId) =>
        liveQuery(() => db.state.where({ _id: selectedObjId }).first())
      )
    );

    // Whenever dataObj changes, fetch the getMergedAncestorProperties promise with the new classId
    const schema$ = dataObj$.pipe(
      switchMap((dataObj) =>
        argoQuery.getMergedAncestorProperties(dataObj.classId)
      )
    );

    // Whenever dataObj changes, fetch the getMergedAncestorProperties promise with the new classId
    const errorObj$ = schema$.pipe(
      switchMap((schema) => {
        const validate = ajv.compile(schema);
        const valid = validate(this.dataObj);
        if (valid) return ["Valid"];
        else return validate.errors;
      })
    );

    return {
      dataObj: dataObj$,
      errorObj: errorObj$,
    };
  },

};
</script>

<style scoped>
.highlight-code >>> .hljs {
  background: unset;
  line-height: 20px;
  font-size: 14px;
}
</style>
