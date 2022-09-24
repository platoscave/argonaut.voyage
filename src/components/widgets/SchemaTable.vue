<script setup lang="ts">
import { ref, reactive, computed, toRefs, watch } from "vue";
import { useHashDissect, updateNextLevelHash } from "~/composables/useHashDissect";
import { usePageSettings, saveColumWidth } from "~/composables/usePageSettings";
import toolbarSymbols from "~/assets/toolbar-symbols.svg";
import { getMaterializedView } from "~/lib/argoUtils";
import useArgoQuery from "~/composables/useArgoQuery";

import { ElDatePicker } from "element-plus";
import Html from "./controls/Html.vue";
import Image from "./controls/Image.vue";
import Json from "./controls/Json.vue";
import NestedObject from "./controls/NestedObject.vue";
import Number from "./controls/Number.vue";
import ObjectsArray from "./controls/ObjectsArray.vue";
import TableArray from "./controls/TableArray.vue";
import SelectStringQuery from "./controls/SelectStringQuery.vue";
import SelectStringEnum from "./controls/SelectStringEnum.vue";
import SelectArrayQuery from "./controls/SelectArrayQuery.vue";
import String from "./controls/String.vue";
import SubForm from "./controls/SubForm.vue";

const props = defineProps({
  hashLevel: Number,
  widgetObj: Object,
});
// interface Props {
//   hashLevel: number;
//   widgetObj: any;
// }
// const props = withDefaults(defineProps<Props>(), {
//   hashLevel: 0,
//   widgetObj: null,
// });
const { selectedObjId, pageId, selectedTab } = useHashDissect(props.hashLevel);
const { columWidths, settingsNextLevelSelectedObjId } = usePageSettings(pageId.value);

const formMode = ref("Readonly Dense");
const tableEl = ref(null);

const dataArr = reactive([]);
const viewObj = reactive({});

interface IDataObj {
  _id: string;
  classId: string;
}

interface IViewObj {
  _id: string;
  classId: string;
}
getMaterializedView(props.widgetObj.viewId).then((view) => {
  Object.assign(viewObj, view);

  const resArr = useArgoQuery(view.queryId, {
    _id: selectedObjId.value,
  });
  watch(resArr, (arr: any[]) => {
    dataArr.length = 0;
    arr.forEach((item) => dataArr.push(item));
  });
});

const onInput = async (updatedDataObj) => {
  /*
  try {

    const stringified = JSON.stringify(updatedDataObj)
    if (stringified === this.oldValue) return
    this.oldValue = stringified

    const valid = await this.$refs["schemaForm"].validate();
    console.log('valid', valid);
    db.state.update(updatedDataObj._id, updatedDataObj);

  } catch (err) {
    this.valid = false;
    this.$message({ showClose: true, message: err.reason.message, type: "error" })
  }
  */
};

const onEditButton = () => {
  if (formMode.value === "Readonly Dense") formMode.value = "Readonly Full";
  else if (formMode.value === "Readonly Full")
    //this.formMode = "Edit Permitted";
    formMode.value = "Edit Full";
  else if (formMode.value === "Edit Permitted") formMode.value = "Edit Full";
  else formMode.value = "Readonly Dense";
};

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

const sortFunc = (type: string, a: any, b: any) => {
  if (type === "string") {
    if (a.toUpperCase() < b.toUpperCase()) return -1;
    if (a.toUpperCase() > b.toUpperCase()) return 1;
    return 0;
  } else if (type === "number") {
    const toFloat = (num) => parseFloat(num.replace(".", "").replace(",", "."));
    return toFloat(a) - toFloat(b);
  }
  return 0;
};

const headerDragend = (newWidth, oldWidth, column) => {
  saveColumWidth(pageId.value, column.property, newWidth);
};

const dynamicComp = [
  { name: "ElDatePicker", comp: ElDatePicker },
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
    if (property.type === "string") {
      if (property.contentMediaType) {
        // HTML
        if (property.contentMediaType === "text/html") return "Html";
        // Image
        else if (property.contentMediaType.startsWith("image/")) return "Image";
        // Javascript, Json
        else return "Json";
      }

      // Select
      else if (property.argoQuery) return "SelectStringQuery";
      // Enumeration
      else if (property.enum) return "SelectStringEnum";
      // Date time
      else if (property.format === "date-time") return "ElDatePicker";
      // Text
      else return "String";
    }

    // Number
    else if (property.type === "number") return "Number";
    // Integer
    else if (property.type === "integer") return "Number";
    // Boolean
    else if (property.type === "boolean") return "ElCheckbox";
    // Object
    else if (property.type === "object" && property.properties) return "NestedObject";
    // Array
    else if (property.type === "array" && property.items) {
      // objects
      if (property.items.type === "object" && property.items.properties) {
        // objects in a table
        if (property.displayAs === "Table") return "TableArray";
        // objects in a subform
        else return "ObjectsArray";
      }

      // multi select
      else if (property.items.type === "string") {
        if (property.items.argoQuery) return "SelectArrayQuery";
        else return "Json";
      }
    }

    // unknown
    return "Json";
  };

  const nameComp = dynamicComp.find((item) => item.name === getControlName());
  if (!nameComp) console.error(`controlName not declared: ${getControlName()}`);
  return nameComp.comp;
};
</script>

<template>
  <!-- table-layout="auto" -->
  <el-table
    v-if="dataArr && viewObj"
    class="ar-table"
    ref="tableEl"
    :data="dataArr"
    highlight-current-row
    border
    @current-change="
      (currentRow) =>
        updateNextLevelHash(hashLevel, currentRow._id, currentRow.treeVars.nodesPageId)
    "
    @header-dragend="headerDragend"
  >
    <!--  -->
    <el-table-column
      v-for="(property, propertyName) in viewObj.properties"
      :key="propertyName"
      :property="propertyName"
      :width="columWidths[propertyName]"
      :label="property.title"
      :sortable="property.type !== 'object' && property.type !== 'array'"
      :sort-method="(a, b) => sortFunc(property.type, a[propertyName], b[propertyName])"
      resizable
    >
      <!-- Header with tooltip. -->
      <template #header>
        <span>{{ property.title + " " }}</span>
        <el-tooltip
          v-if="property.description"
          effect="light"
          :content="property.description"
          raw-content
        >
          <svg class="icon" height="1em" width="1em" color="blue">
            <use
              xmlns:xlink="http://www.w3.org/1999/xlink"
              :xlink:href="'toolbar-symbols.svg#el-icon-info'"
            ></use>
          </svg>
        </el-tooltip>
      </template>

      <!-- The control -->
      <template #default="scope">
        <!-- 
          ar-control-selector is a functional component that that replaces itself with a control component
          depending on property type. It also performs some magic on certain property.attrs
          - readonly is used by standard input elements to disable input and by css to remove blue border
          - required is used by Selects to optionaly add a clear button (or a None option in the case of radio buttons)
          - hash-level is used by Selects with a argoQuery (to get selectedObjectId from hash)
          - property and form-mode are passed in case we're creating a subForm
          - We use the v-model pattern to send/recieve data to/from child components. 
            Below, we watch for changes to modelValue and emit input events accordingly.
          -->
        <component
          :is="getComponent(property)"
          class="ar-control"
          v-model="scope.row[propertyName]"
          :property="property"
          :readonly="formMode.startsWith('Readonly')"
          :required="false"
          :hash-level="hashLevel"
          :form-mode="formMode"
        ></component>
      </template>
    </el-table-column>
  </el-table>
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

.ar-table >>> .el-table__cell {
  padding: 4px;
  border-bottom: unset;
}
.ar-table >>> .cell {
  padding: unset;
  word-break: unset;
  /* line-height: 23px; */
}

.ar-table >>> th .cell {
  padding: 10px;
}
</style>
