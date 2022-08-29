<script setup lang="ts">
import { ref, reactive, watch } from "vue";
import { db } from "~/services/dexieServices";
import useLiveQuery from "~/composables/useLiveQuery";
import { onClickOutside } from "@vueuse/core";

interface Props {
  hashLevel?: number;
  paragraphId?: string;
  headerLevel?: number;
}
const props = withDefaults(defineProps<Props>(), {
  hashLevel: 0,
  paragraphId: "",
  headerLevel: 1,
});

const readonly = ref(true);
const editorsEl = ref(null);
const header = ref("");
const content = ref("");
let subParagraphIds = reactive([]);

interface IParagraph {
  _id: string;
  name: string;
  description: string;
  subParagraphIds: string[];
}
const paragraphObj = useLiveQuery<IParagraph>(() => db.state.get(props.paragraphId), [
  () => props.paragraphId,
]);

watch(paragraphObj, (paragraph) => {
  //Object.assign(paragraphObj, paragraph);
  header.value = paragraph.name;
  content.value = paragraph.description;
  subParagraphIds.length = 0;
  paragraph.subParagraphIds.forEach((item) => subParagraphIds.push(item));
});

const onHeaderChanged = (updatedHeader: string) => {
  db.state.update(props.paragraphId, { name: updatedHeader });
};

const onContentChanged = (updatedContent: string) => {
  console.log("headerChanged", updatedContent);
  db.state.update(props.paragraphId, { description: updatedContent });
};

onClickOutside(editorsEl, (event) => {
  readonly.value = true;
});
</script>

<template>
  <div class="ar-subform-background" ref="editorsEl">
    <svg class="el-icon-close" v-if="readonly" @click="readonly = false" color="blue">
      <use
        xmlns:xlink="http://www.w3.org/1999/xlink"
        :xlink:href="'toolbar-symbols.svg#el-icon-close'"
      ></use>
    </svg>

    <component v-bind:is="`h${$props.headerLevel}`">
      <String
        class="ar-header"
        v-model="header"
        :readonly="readonly"
        @change="onHeaderChanged"
      ></String>
    </component>

    <Html v-model="content" :readonly="readonly" @change="onContentChanged"></Html>
  </div>

  <div v-for="(paragraphId, idx) in subParagraphIds" :key="idx">
    <Paragraph
      :paragraph-id="paragraphId"
      :header-level="props.headerLevel + 1"
    ></Paragraph>
  </div>
</template>

<style scoped>
.ar-subform-background {
  padding: 10px 10px 10px 15px;
  position: relative;
  max-width: 750px;
}
.el-icon-close {
  height: 1em;
  width: 1em;
  position: absolute;
  margin: 3px;
  top: 3px;
  right: 3px;
  z-index: 20;
  border-radius: 50%;
}
/* give input the same size and weight as the header */
.el-input {
  font-size: inherit;
}
.ar-header >>> input {
  font-weight: inherit;
}
.ar-header {
  padding: 6px 7px;
}
/* .ar-header >>> .ProseMirror{
  padding: 6px 7px;
} */
</style>
