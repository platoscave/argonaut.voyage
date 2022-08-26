<script setup lang="ts">
import { ref, reactive, watch, h } from "vue";
import { db } from "~/services/dexieServices";
import useLiveQuery from "~/composables/useLiveQuery";
import {
  useHashDissect,
  updateHashWithSelectedTab,
} from "~/composables/useHashDissect";

// const props = defineProps({
//   hashLevel: Number,
//   paragraphId: String,
//   headerLevel: {
//     type: Number,
//     default: 0
//   },
  
// });
interface Props {
  hashLevel?: number
  paragraphId?: string
  headerLevel?: number
}
const props = withDefaults(defineProps<Props>(), {
  hashLevel: 0,
  paragraphId: '',
  headerLevel: 1
})


const { selectedObjId } = useHashDissect(props.hashLevel);
const header = ref('');
const content = ref('');
let subParagraphIds = reactive([]);


interface IParagraph {
  _id: string;
  name: string;
  description: string;
  subParagraphIds: string[];
}

if (props.paragraphId) {
  const localParagraphObj = useLiveQuery<IParagraph>(
    () => db.state.get(props.paragraphId),
    []
  );
  watch(localParagraphObj, (paragraph) => {
    //Object.assign(paragraphObj, paragraph);
    header.value = paragraph.name
    content.value = paragraph.description
    subParagraphIds.length = 0
    paragraph.subParagraphIds.forEach( item => subParagraphIds.push(item))
  });
} else {
  const localParagraphObj = useLiveQuery<IParagraph>(
    () => db.state.get(selectedObjId.value),
    [selectedObjId]
  );
  watch(localParagraphObj, (paragraph) => {
    //Object.assign(paragraphObj, paragraph);
    header.value = paragraph.name
    content.value = paragraph.description
    subParagraphIds.length = 0
    paragraph.subParagraphIds.forEach( item => subParagraphIds.push(item))
  });
}
</script>

<template>
  <!-- <div v-if="paragraphObj"> -->
    <component v-bind:is="`h${$props.headerLevel}`">{{
      header
    }}</component>
    <div v-html="content" />
    <div v-for="(paragraphId, idx) in subParagraphIds" :key="idx">
      <Paragraph
        :paragraph-id="paragraphId"
        :header-level="props.headerLevel + 1"
      ></Paragraph>
    </div>
  <!-- </div> -->
</template>

<style scoped></style>
