<template>
  <highlight-code lang="json" class="highlight-code">
    {{ errorObj }}
  </highlight-code>
</template>

<script>
import WidgetMixin from "../../../lib/widgetMixin"
import QueryMixin from "../../../lib/queryMixin"
import Ajv from "ajv"
import * as draft4MetaSchema from "ajv/lib/refs/json-schema-draft-04.json"

const ajv = new Ajv({allErrors: true, schemaId: "auto"}) // or "auto" if you use both draft-04 and draft-06/07 schemas
ajv.addMetaSchema(draft4MetaSchema)

export default {
  name: 'ar-validate',
  mixins: [WidgetMixin, QueryMixin], 
  props: {
    hashLevel: Number,
    viewId: String
  },
  data() {
    return {
      errorObj: {}
    };
  },
  pouch: {
    dataObj: function () {
      return {
        database: "argonaut",
        selector: { _id: this.selectedObjId },
        first: true,
      };
    },
  },
  watch: {
    dataObj: function (value) {
      // immediate: true doesn't work. Too early. Pouch hasn't been initialized yet
      // Thats why we need both mounted and watch
      if(value) this.getMergedAncestorProperties( value.classId ).then( schema => {
        const validate = ajv.compile(schema)
        const valid = validate(value)
        if(valid) this.errorObj = 'Valid'
        else this.errorObj = validate.errors
      })
    },
  },
  mounted() {
    if(this.dataObj) this.getMergedAncestorProperties( this.dataObj.classId ).then( schema => {
      const validate = ajv.compile(schema)
      const valid = validate(value)
      this.errorObj = validate.errors
    })
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
