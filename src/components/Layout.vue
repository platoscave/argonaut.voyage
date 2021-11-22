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
      :size="pageSettings.paneSize ? pageSettings.paneSize : 200"
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
      v-bind:left-size="pageSettings.leftSize"
      v-bind:right-size="pageSettings.rightSize"
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
import WidgetMixin from "../lib/widgetMixin";
import ResSplitPane from "vue-resize-split-pane";
import Studio from "./StudioLayout";
import ClassModel from "./widgets/ClassModel.vue";
import ProcessModel from "./widgets/ProcessModel.vue";
import OrganizationModel from "./widgets/OrganizationModel.vue";

export default {
  name: "ar-layout",
  mixins: [WidgetMixin],
  components: {
    "rs-panes": ResSplitPane,
    "ar-studio": Studio,
    "ar-class-model": ClassModel,
    "ar-process-model": ProcessModel,
    "ar-organization-model": OrganizationModel,
  },
  props: {
    hashLevel: Number,
  },
  data() {
    return {
      leftOpen: true,
      rightOpen: false,
    };
  },
  pouch: {
    pageObj: function() {
      return {
        database: "blockprocess",
        selector: { _id: this.pageId },
        first: true,
      };
    },
    pageSettings: function() {
      return {
        database: "settings",
        selector: { _id: this.pageId },
        first: true,
      };
    },
  },
  methods: {
    paneResizeStop(paneSize) {
      this.$settings.upsert(this.pageId, (doc) => {
        doc.paneSize = paneSize;
        return doc;
      });
    },
    leftSizeStop(leftSize) {
      this.$settings.upsert(this.pageId, (doc) => {
        doc.leftSize = leftSize;
        return doc;
      });
    },
    rightSizeStop(rightSize) {
      this.$settings.upsert(this.pageId, (doc) => {
        doc.rightSize = rightSize;
        return doc;
      });
    },
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
