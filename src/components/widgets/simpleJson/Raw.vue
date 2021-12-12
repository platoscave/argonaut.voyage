<template>
  <highlight-code lang="json" class="highlight-code">
    {{ dataObj }}
  </highlight-code>
</template>

<script>
import { liveQuery } from "dexie";
import { pluck, switchMap } from "rxjs/operators";
import WidgetMixin from "../../../lib/widgetMixin";

export default {
  name: 'ar-raw',
  mixins: [WidgetMixin], 
  props: {
    hashLevel: Number,
    viewId: String
  },
  subscriptions() {
    // Watch the selectedObjId as observable
    const selectedObjId$ = this.$watchAsObservable("selectedObjId", {
      immediate: true,
    }).pipe(pluck("newValue"));
    // Whenever it changes, reset the live query with the new selectedObjId
    const dataObj$ = selectedObjId$.pipe(
      switchMap((selectedObjId) =>
        liveQuery(() => db.state.where({ _id:  selectedObjId ? selectedObjId : '' }).first())
      )
    );
    return {
      dataObj: dataObj$,
    };
  },
}
</script>

<style scoped>
.highlight-code >>> .hljs{
  background: unset;
  line-height: 20px;
  font-size: 14px;
}
</style>
