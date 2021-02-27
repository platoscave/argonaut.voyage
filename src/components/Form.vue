<template>
  <div v-if="dataObj && viewObj" class="hello">
    <ar-json-schema-form
      ref="schemaForm"
      class="json-schema-form"
      v-model="dataObj"
      :schema="viewObj"
      :form-read-only="readonly"
      :omit-empty-fields="omitEmptyFields"
      v-on:change="onChange"
    >
    </ar-json-schema-form>
  </div>
</template>

<script>
import JsonSchemaForm from './JsonSchemaForm';

export default {
  name: "ar-form",  
  components: {
    'ar-json-schema-form': JsonSchemaForm
  },
  props: {
    hashLevel: Number,
  },
  data() {
    return {
      selectedObjId: null,
      pageId: null,
      viewId: null,
      readonly: false,
      omitEmptyFields: false,
      valid: false,
      schema: {
        $schema: "http://json-schema.org/draft-04/schema#",
        type: "object",
        title: "Newsletter Subscription",
        description:
          "Sign up for free newsletters and get more delivered to your inbox",
        properties: {
          text: {
            type: "string",
            minLength: 6,
            maxLength: 80,
            title: "Full Name",
            attrs: {
              placeholder: "Your Full Name",
            },
            description: "This is a tooltip description",
          },
        },
      },
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
    pageObj: function () {
      return {
        database: "argonaut",
        selector: { _id: this.pageId },
        first: true,
      };
    },
    viewObj: function () {
      return {
        database: "argonaut",
        selector: { _id: this.pageObj ? this.pageObj.viewId : null},
        first: true,
      };
    },
  },
  methods: {

    onChange(newDataObj) {
      this.$refs["schemaForm"].validate().then(
        () => {
          this.valid = true;
          this.$argonaut
            .get(this.selectedObjId)
            .then((doc) => {
              doc = doc.assign( doc, newDataObj)
              return this.$settings.put(doc);
            })
            .catch((err) =>
              this.$message({ showClose: true, message: err, type: "error" })
            );
        },
        () => {
          this.valid = false;
        }
      );
    },

    handleHashChange: function () {
      const ourLevelArr = window.location.hash.split("/")[this.hashLevel + 1];
      if (!ourLevelArr) return;
      const levelStates = ourLevelArr.split(".");
      this.selectedObjId = levelStates[0];
      this.pageId = levelStates[1];
    },
  },
  mounted() {
    window.addEventListener("hashchange", this.handleHashChange, false);
    this.handleHashChange();
  },
  beforeDestroy() {
    window.removeEventListener("hashchange", this.handleHashChange, false);
  },
};
</script>

<style scoped>
.hello {
  background-color: pink;
}
</style>
