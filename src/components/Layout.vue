<script setup lang="ts">
import { ref, reactive, onMounted, computed, toRefs } from "vue";
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

onMounted(async () => {
  if (pageId.value) {
    const pageSettings = await db.settings.get(pageId.value);
    if (pageSettings) {
      if (pageSettings.splitterSettings)
        splitterSettings = pageSettings.splitterSettings;
    } else await db.settings.add({ pageId: pageId.value });
  }
});
</script>

<template>
  <div v-if="pageObj">
    <!-- Divider layout -->

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

    <component
      :is="getComponent(pageObj.model)"
      v-else-if="pageObj.layout === 'Studio'"
      class="ar-full-height"
      v-bind:hash-level="hashLevel"
      v-bind:view-id="pageObj.tabs[0].widgets[0].viewId"
    ></component>

    <!-- Single page layout -->

    <Page v-else class="ar-full-height" v-bind:hash-level="hashLevel"></Page>

    <!-- <StudioLayout
      class="ar-full-height"
      v-else
      v-on:leftsize="leftSizeStop"
      v-on:rightsize="rightSizeStop"
      v-bind:left-size="layoutSettings.leftSize"
      v-bind:right-size="layoutSettings.rightSize"
    >

      < !-- Background content -->

    <!-- TODO divider misuse. Come up with a better way to determin which model to dispaly 
            It's almost like we need a second pageId-- >

      <ClassModel
        v-if="pageObj.divider === 'Class Model'"
        slot="diagram"
        class="ar-full-height"
        v-bind:hash-level="hashLevel"
        v-bind:view-id="pageObj.tabs[0].widgets[0].viewId"
      ></ClassModel>

      <ProcessModel
        v-else-if="pageObj.divider === 'Process Model'"
        slot="diagram"
        class="ar-full-height"
        v-bind:hash-level="hashLevel"
        v-bind:view-id="pageObj.tabs[0].widgets[0].viewId"
      ></ProcessModel>


      < !-- Master content -- >

      <Page
        slot="drawer-left"
        class="ar-full-height"
        v-bind:hash-level="hashLevel"
        v-bind:tabs="pageObj.tabs"
      ></Page>

      < !-- Slave content -- >

      <Layout
        slot="drawer-right"
        class="ar-full-height right"
        v-bind:hash-level="hashLevel + 1"
      ></Layout>

    </StudioLayout> -->
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
