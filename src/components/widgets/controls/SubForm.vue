<script setup lang="ts">
import { ref, reactive, computed, toRefs, watch } from "vue";
import toolbarSymbols from "~/assets/toolbar-symbols.svg";

// import ControlSelector from "./ControlSelector";
// /* eslint-disable vue/no-unused-components */
// // on behalf of the control selector
import DateTime from "./DateTime.vue";
import Html from "./Html.vue";
import Image from "./Image.vue";
import Json from "./Json.vue";
import NestedObject from "./NestedObject.vue";
import Number from "./Number.vue";
import ObjectsArray from "./ObjectsArray.vue";
import TableArray from "./TableArray.vue";
import SelectStringQuery from "./SelectStringQuery.vue";
import SelectStringEnum from "./SelectStringEnum.vue";
import SelectArrayQuery from "./SelectArrayQuery.vue";
import String from "./String.vue";
import SubForm from "./SubForm.vue";

// For some reason I can only add default to requiredArr.
// As soon as I addd others I get wierd compiler erros. I'm clueless.
const props = defineProps({
  hashLevel: Number,
  modelValue: Object,
  properties: Object,
  requiredArr: { type: Array, default: () => [] },
  formMode: String,
});
// const props = defineProps({
//   hashLevel: { type: Number, default: 0 },
//   modelValue: { type: Object, default: () => {} },
//   properties: { type: Object, default: () => {} },
//   requiredArr: { type: Array, default: () => [] },
//   formMode: { type: String, default: "Readonly Dense" },
// })
const emit = defineEmits(["update:modelValue"]);

const formEl = ref(null);

// methodes possibly called from outside, so pass on to our form
const validate = () => {
  return formEl.value.validate();
};
const resetFields = () => {
  formEl.value.resetFields();
};
defineExpose({ validate, resetFields });

const validationRules = computed(() => {
  // no rules for readonly
  if (props.formMode === "Readonly Dense" || props.formMode === "Readonly Full")
    return {};

  let rulesObj = {};
  for (var propertyName in props.properties) {
    const property = props.properties[propertyName];

    let rulesArr = [];

    if (props.requiredArr.includes(propertyName)) {
      rulesArr.push({
        required: true,
        message: property.title + " is required.",
      });
    }

    if (property.minLength) {
      rulesArr.push({
        min: property.minLength,
        message: "Please enter at least " + property.minLength + " characters.",
      });
    }

    // email
    if (property.format) {
      if (property.format === "email") {
        rulesArr.push({
          type: "email",
          message: "Please enter a valid email address. eg: name@provider.com",
        });
      } else if (property.format === "uri") {
        rulesArr.push({
          type: "url",
          message: "Please enter a valid url. eg: https://provider.com",
        });
      }
    }

    if (property.pattern) {
      rulesArr.push({
        pattern: property.pattern,
        message: " Input must comply with: " + property.pattern,
      });
    }

    rulesObj[propertyName] = rulesArr;
  }

  return rulesObj;
});

const notReadonlyDenseAndEmpty = (formMode: string, dataObj: object[], type: string) => {
  if (
    formMode === "Readonly Dense" &&
    (!dataObj || // modelValue is empty
      (type === "array" && !dataObj.length) || // modelValue is an array and is empty
      (type === "object" && !Object.keys(dataObj).length)) // modelValue is an object and is empty
  )
    return false;
  return true;
};

const dynamicComp = [
  { name: "DateTime", comp: DateTime },
  { name: "Html", comp: Html },
  { name: "Image", comp: Image },
  { name: "Json", comp: Json },
  { name: "NestedObject", comp: NestedObject },
  { name: "Number", comp: Number },
  { name: "ObjectsArray", comp: ObjectsArray },
  { name: "SelectArrayQuery", comp: SelectArrayQuery },
  { name: "SelectStringEnum", comp: SelectStringEnum },
  { name: "SelectStringQuery", comp: SelectStringQuery },
  { name: "String", comp: String },
  { name: "SubForm", comp: SubForm },
  { name: "TableArray", comp: TableArray },
];
interface IProperty {
  type: string;
  contentMediaType: string;
  argoQuery: object;
  enum: string[];
  format: string;
  properties: object;
  items: {
    type: string;
    properties: object;
    argoQuery: object;
  };
  displayAs: string;
}
const getComponent = (property: IProperty) => {
  // Determin the control type
  const getControlName = () => {

    switch (property.type) {
      case "string":
        const mediaType = property.contentMediaType
        if (mediaType) {
          if (mediaType === "text/html") return "Html";
          if (mediaType.startsWith("image/")) return "Image";
          return "Json";
        }
        if (property.argoQuery) return "SelectStringQuery";
        if (property.enum) return "SelectStringEnum";
        if (property.format === "date-time") return "DateTime";
        return "String";
      case "number": return "Number";
      case "integer": return "Number";
      case "boolean": return "ElCheckbox";
      case "object": if (property.properties) return "NestedObject";
      case "array":
        if (property.items) {
          // objects
          if (property.items.type === "object" && property.items.properties) {
            if (property.displayAs === "Table") return "TableArray"; // objects in a table
            return "ObjectsArray"; // objects in a subform
          }
          // multi select
          else if (property.items.type === "string") {
            if (property.items.argoQuery) return "SelectArrayQuery";
            return "Json";
          }
        }
    }
    return "Json";

  };

  const nameComp = dynamicComp.find((item) => item.name === getControlName());

  if (!nameComp) console.error(`controlName not declared: ${getControlName()}`);
  return nameComp.comp;
};
</script>

<template>
  <!-- Validation rules are provided by a Computed 
  :model and :rules are needed for validation rules. Do not mess with them! You will regret it-->
  <el-form ref="formEl" :model="modelValue" :rules="validationRules" labelWidth="100px" labelPosition="left"
    :show-message="formMode.startsWith('Edit')">
    <div v-for="(property, propertyName) in properties" :key="propertyName">
      <!-- Skip form item if formMode is Readonly Dense and modelValue is empty -->
      <!-- :prop is needed for validation rules. Do not mess with it! -->
      <el-form-item class="ar-form-item" v-if="notReadonlyDenseAndEmpty(formMode, modelValue[propertyName], property.type)
        " :prop="propertyName">
        <!-- Label with tooltip. -->
        <template #label>
          <span>{{ property.title + " " }}</span>
          <el-tooltip v-if="property.description" effect="light" :content="property.description" raw-content>
            <svg class="icon" height="1em" width="1em" color="blue">
              <use xmlns:xlink="http://www.w3.org/1999/xlink" :xlink:href="'toolbar-symbols.svg#el-icon-info'"></use>
            </svg>
          </el-tooltip>
        </template>
        <!-- 
            The control
            ar-control-selector is a functional component that that replaces itself with a control component
            depending on property type. It also performs some magic on certain property.attrs
            - readonly is used by standard input elements to disable input and by css to remove blue border
            - required is used by Selects to optionaly add a clear button (or a None option in the case of radio buttons)
            - hash-level is used by Selects with a argoQuery (to get selectedObjectId from hash)
            - property and form-mode are passed in case we're creating a subForm
            - We use the v-model pattern to send/recieve data to/from child components. 
              Below, we watch for changes to modelValue and emit input events accordingly.
           -->
        <component :is="getComponent(property)" class="ar-control" v-model="modelValue[propertyName]" :property="property"
          :readonly="formMode.startsWith('Readonly')" :required="requiredArr.includes(propertyName)"
          :hash-level="hashLevel" :form-mode="formMode"></component>
      </el-form-item>
    </div>
  </el-form>
</template>

<style scoped>
.ar-json-schema-form {
  max-width: 750px;
}

.icon {
  margin-left: 5px;
}

/* Item bottom margin */
.el-form-item {
  margin-bottom: 8px;
}
</style>

<style>
/* Error success borders: lighter */
.el-form-item.is-error .el-input__inner,
.el-form-item.is-error .el-input__inner:focus,
.el-form-item.is-error .el-textarea__inner,
.el-form-item.is-error .el-textarea__inner:focus {
  border-color: #f56c6c88;
}

.el-form-item.is-success .el-input__inner,
.el-form-item.is-success .el-input__inner:focus,
.el-form-item.is-success .el-textarea__inner,
.el-form-item.is-success .el-textarea__inner:focus {
  /* border-color: #67c23a88; */
  border-color: none;
}
</style>
