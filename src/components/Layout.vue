<template>
  <div v-if="pageObj">
    <!-- Single page layout -->
    <ar-page
      v-if="!pageObj.divider || pageObj.divider === 'None'"
      class="ar-full-height"
      v-bind:hash-level="hashLevel"
      v-bind:tabs="pageObj.tabs"
    ></ar-page>

    <!-- Divider layout -->
    <rs-panes
      v-else-if="
        pageObj.divider === 'Vertical' || pageObj.divider === 'Horizontal'
      "
      split-to="columns"
      :allow-resize="true"
      v-on:update:size="paneResizeStop"
      :size="layoutSettings.paneSize"
      :min-size="40"
      resizerColor="#2196f3"
    >
      <!-- Master content -->
      <ar-page
        class="ar-full-height"
        slot="firstPane"
        v-bind:hash-level="hashLevel"
        v-bind:tabs="pageObj.tabs"
      ></ar-page>

      <!-- Slave content -->
      <ar-layout
        class="ar-full-height right"
        slot="secondPane"
        v-bind:hash-level="hashLevel + 1"
      ></ar-layout>
    </rs-panes>

    <!-- Studio layout -->
    <ar-studio
      class="ar-full-height"
      v-else
      v-on:leftsize="leftSizeStop"
      v-on:rightsize="rightSizeStop"
      v-bind:left-size="layoutSettings.leftSize"
      v-bind:right-size="layoutSettings.rightSize"
    >
      <!-- Background content -->
      <!-- TODO divider misuse. Come up with a better way to determin which model to dispaly 
            It's almost like we need a second pageId-->
      <ar-class-model
        v-if="pageObj.divider === 'Class Model'"
        slot="diagram"
        class="ar-full-height"
        v-bind:hash-level="hashLevel"
        v-bind:view-id="pageObj.tabs[0].widgets[0].viewId"
      ></ar-class-model>
      <ar-process-model
        v-else-if="pageObj.divider === 'Process Model'"
        slot="diagram"
        class="ar-full-height"
        v-bind:hash-level="hashLevel"
        v-bind:view-id="pageObj.tabs[0].widgets[0].viewId"
      ></ar-process-model>
      <ar-organization-model
        v-else-if="pageObj.divider === 'Organization'"
        slot="diagram"
        class="ar-full-height"
        v-bind:hash-level="hashLevel"
        v-bind:view-id="pageObj.tabs[0].widgets[0].viewId"
      ></ar-organization-model>

      <!-- Master content -->
      <ar-page
        slot="drawer-left"
        class="ar-full-height"
        v-bind:hash-level="hashLevel"
        v-bind:tabs="pageObj.tabs"
      ></ar-page>
      <!-- Slave content -->
      <ar-layout
        slot="drawer-right"
        class="ar-full-height right"
        v-bind:hash-level="hashLevel + 1"
      ></ar-layout>
    </ar-studio>
  </div>
</template>

<script>
import { db } from "../services/dexieServices";
import { liveQuery } from "dexie";
import WidgetMixin from "../lib/widgetMixin";
import ResSplitPane from "vue-resize-split-pane";
import Studio from "./StudioLayout";
import ClassModel from "./widgets/ClassModel.vue";
import ProcessModel from "./widgets/ProcessModel.vue";

export default {
  name: "ar-layout",
  mixins: [WidgetMixin],
  components: {
    "rs-panes": ResSplitPane,
    "ar-studio": Studio,
    "ar-class-model": ClassModel,
    "ar-process-model": ProcessModel,
  },
  props: {
    hashLevel: Number,
  },
  data() {
    return {
      layoutSettings: {
        paneSize: 200,
        leftSize: 300,
        rightSize: 300,
      },
    };
  }, 

  subscriptions() {
    // We need this extra handleHashChange because for some reason the data vars get nuked
    // right before subscriptions are created, regardless wether I put handleHashChange in
    // created or mounted or not. Any thoughts?
    this.handleHashChange();

    return {
      pageObj: liveQuery(() => db.state.where({ _id: this.pageId }).first()),
    };
  },
  methods: {
    async paneResizeStop(paneSize) {
      this.layoutSettings.paneSize = paneSize;
      await db.settings.update(this.pageId, {
        layoutSettings: this.layoutSettings,
      });
    },
    async leftSizeStop(leftSize) {
      this.layoutSettings.leftSize = leftSize;
      await db.settings.update(this.pageId, {
        layoutSettings: this.layoutSettings,
      });
    },
    async rightSizeStop(rightSize) {
      this.layoutSettings.rightSize = rightSize;
      await db.settings.update(this.pageId, {
        layoutSettings: this.layoutSettings,
      });
    },
  },
  async mounted() {
    if (this.pageId) {
      // See if we can get a layout settings from the last time we visited this page
      const pageSettings = await db.settings.get(this.pageId);
      if (pageSettings) {
        if (pageSettings.layoutSettings)
          this.layoutSettings = pageSettings.layoutSettings;
      } else await db.settings.add({ pageId: this.pageId });
    }
  },
};
</script>
<style scoped>
/* Split pane */
.right > div {
  height: 100%;
}
.pane-rs {
  position: unset;
}
</style>
