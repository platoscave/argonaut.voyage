<script setup lang="ts">
import { ref, reactive } from "vue";
import { db } from "~/services/dexieServices";
import useLiveQuery from "~/composables/useLiveQuery";
import { useHashDissect } from "~/composables/useHashDissect";
import { Splitpanes, Pane } from "splitpanes";
import "splitpanes/dist/splitpanes.css";
// import Studio from "./StudioLayout";
import ClassModel from "~/components/widgets/3dModels/ClassModel.vue";
import ProcessModel from "~/components/widgets/3dModels/ProcessModel.vue";

const props = defineProps({
  hashLevel: Number,
});

let splitterSettings = reactive([20, 80]);

const { pageId } = useHashDissect(props.hashLevel);

interface pageRec {
  _id: string;
  name: string;
  layout: string;
  divider: string;
  model: string;
  tabs: object[];
}

const pageObj = useLiveQuery<pageRec>(
  () => db.state.get(pageId.value),
  [pageId]
);

db.settings.get(pageId.value).then((pageSettings) => {
  if (pageSettings && pageSettings.splitterSettings) {
    splitterSettings[0] = pageSettings.splitterSettings[0]
    splitterSettings[1] = pageSettings.splitterSettings[1]
  }
  // add empty pagesettings for update to work
  if (!pageSettings) db.settings.add({ pageId: pageId.value });
})

const onResized = (splitterSettingsArr) => {
  console.log("splitterSettings", splitterSettingsArr);
  db.settings.update(pageId.value, {
    splitterSettings: splitterSettingsArr.map((item) => item.size),
  });
};

const dynamicComp = [
  { name: "Class Model", comp: ClassModel },
  { name: "Process Model", comp: ProcessModel },
];
const getComponent = (widgetName: string) => {
  return dynamicComp.find((item) => item.name === widgetName).comp;
};

</script>

<template>
  <div v-if="pageObj">
    <!-- Master Detail layout -->

    <splitpanes
      v-if="pageObj.layout === 'Master Detail'"
      style="height: 100%"
      @resized="onResized"
    >
      <!-- Master -->
      <pane :size="splitterSettings[0]">
        <Page class="ar-full-height" v-bind:hash-level="hashLevel"></Page>
      </pane>
      <!-- Detail -->
      <pane :size="splitterSettings[1]">
        <Layout
          class="ar-full-height right"
          v-bind:hash-level="hashLevel + 1"
        ></Layout>
      </pane>
    </splitpanes>

    <!-- Studio layout -->

    <!-- <StudioLayout
      v-else-if="pageObj.layout === 'Studio'"
      class="ar-full-height"
      v-on:leftsize="leftSizeStop"
      v-on:rightsize="rightSizeStop"
      v-bind:left-size="layoutSettings.leftSize"
      v-bind:right-size="layoutSettings.rightSize"
    >

      < !-- Background content -->

    <component
      :is="getComponent(pageObj.model)"
      v-else-if="pageObj.layout === 'Studio'"
      class="ar-full-height"
      v-bind:hash-level="hashLevel"
      v-bind:view-id="pageObj.tabs[0].widgets[0].viewId"
    ></component>

    <!-- Master content -- >

      <Page class="ar-full-height" v-bind:hash-level="hashLevel"></Page>

      < !-- Detail content -- >

      <Page class="ar-full-height" v-bind:hash-level="hashLevel + 1"></Page>

    </StudioLayout> -->

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
