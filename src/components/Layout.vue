<script setup lang="ts">
import { ref, reactive } from "vue";
import { db } from "~/services/dexieServices";
import useLiveQuery from "~/composables/useLiveQuery";
import { useHashDissect } from "~/composables/useHashDissect";
import {
  usePageSettings,
  saveSplitterSettings,
  saveLeftSize,
  saveRightSize,
} from "~/composables/usePageSettings";
import { Splitpanes, Pane } from "splitpanes";
import "splitpanes/dist/splitpanes.css";
import StudioLayout from "./StudioLayout.vue";
import ClassModel from "~/components/widgets/3dModels/ClassModel.vue";
import ProcessModel from "~/components/widgets/3dModels/ProcessModel.vue";

const props = defineProps({
  hashLevel: Number,
});

const { pageId } = useHashDissect(props.hashLevel);
const { splitterSettings, leftSize, rightSize } = usePageSettings(pageId.value);

interface pageRec {
  _id: string;
  name: string;
  layout: string;
  divider: string;
  model: string;
  tabs: object[];
}
const pageObj = useLiveQuery<pageRec>(() => db.state.get(pageId.value), [pageId]);

const dynamicComp = [
  { name: "Class Model", comp: ClassModel },
  { name: "Process Model", comp: ProcessModel },
];
const getComponent = (widgetName: string) => {
  return dynamicComp.find((item) => item.name === widgetName).comp;
};
</script>

<template>
  <div v-if="pageObj && splitterSettings">
    <!-- Master Detail layout -->

    <splitpanes
      v-if="pageObj.layout === 'Master Detail'"
      style="height: 100%"
      @resized="(resizedArr) => saveSplitterSettings(pageId, resizedArr)"
    >
      <!-- Master -->
      <pane :size="splitterSettings[0]">
        <Page class="ar-full-height" v-bind:hash-level="hashLevel"></Page>
      </pane>
      <!-- Detail -->
      <pane :size="splitterSettings[1]">
        <Layout class="ar-full-height right" v-bind:hash-level="hashLevel + 1"></Layout>
      </pane>
    </splitpanes>

    <!-- Studio layout -->
    <!-- 


-->
    <StudioLayout
      v-else-if="pageObj.layout === 'Studio'"
      class="ar-full-height"
      :left-size="leftSize"
      :right-size="rightSize"
      @leftsizestop="(leftSize) => saveLeftSize(pageId, leftSize)"
      @rightsizestop="(rightSize) => saveRightSize(pageId, rightSize)"
    >
      <!-- Background content -->
      <component
        :is="getComponent(pageObj.model)"
        class="ar-full-height"
        :hash-level="hashLevel"
        :view-id="pageObj.tabs[0].widgets[0].viewId"
      ></component>
      <!-- Master content -->
      <template #drawer-left>
        <Page class="ar-full-height" v-bind:hash-level="hashLevel"></Page>
      </template>
      <!-- Detail content -->
      <template #drawer-right>
        <Page class="ar-full-height" v-bind:hash-level="hashLevel + 1"></Page>
      </template>
    </StudioLayout>

    <!-- Single page layout -->

    <Page v-else class="ar-full-height" v-bind:hash-level="hashLevel"></Page>
  </div>
</template>

<style>
/* Split pane */

.splitpanes--vertical > .splitpanes__splitter {
  min-width: 3px;
  background: linear-gradient(90deg, #ccc, #111);
}

.splitpanes--horizontal > .splitpanes__splitter {
  min-height: 3px;
  background: linear-gradient(0deg, #ccc, #111);
}
</style>
