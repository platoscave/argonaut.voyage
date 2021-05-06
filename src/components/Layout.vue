<template>
  <div v-if="pageObj">
    <!-- Single page content -->
    <div
      class="ar-full-height"
      v-if="!pageObj.divider || pageObj.divider === 'None'"
    >
      <ar-page
        class="ar-full-height"
        v-bind:hash-level="hashLevel"
        v-bind:tabs="pageObj.tabs"
      ></ar-page>
    </div>

    <!-- Divider content -->
    <div
      class="ar-full-height"
      v-else-if="
        pageObj.divider === 'Vertical' || pageObj.divider === 'Horizontal'
      "
    >
      <!-- split-to="pageObj.divider === 'Horizontal' ? 'rows' : 'columns'" -->
      <rs-panes
        split-to="columns"
        :allow-resize="true"
        v-on:update:size="paneResizeStop"
        :size="pageSettings ? pageSettings.paneSize : 300"
        :min-size="40"
        resizerColor="#2196f3"
      >
        <!-- Master content -->
        <div class="ar-full-height" slot="firstPane">
          <ar-page
            v-bind:hash-level="hashLevel"
            v-bind:tabs="pageObj.tabs"
          ></ar-page>
        </div>

        <!-- Slave content -->
        <div class="ar-full-height right" slot="secondPane">
          <ar-layout v-bind:hash-level="hashLevel + 1"></ar-layout>
        </div>
      </rs-panes>
    </div>

    <!-- Studio -->
    <ar-studio class="ar-full-height" v-else>

      <!-- Background content -->
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
        :hash-level="hashLevel + 1"
      ></ar-layout>
    </ar-studio>

  </div>
</template>

<script>
import ResSplitPane from "vue-resize-split-pane";
import Studio from "./StudioLayout";
import ClassModel from "./widgets/ClassModel.vue";
import ProcessModel from "./widgets/ProcessModel.vue";
import OrganizationModel from "./widgets/OrganizationModel.vue";

export default {
  name: "ar-layout",
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
      pageId: null,
      //pageObj: Object,
      leftOpen: true,
      rightOpen: false,
    };
  },
  pouch: {
    pageObj: function () {
      return {
        database: "argonaut",
        selector: { _id: this.pageId },
        first: true,
      };
    },
    pageSettings: function () {
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

    handleHashChange: async function () {
      const ourLevelArr = window.location.hash.split("/")[this.hashLevel + 1];
      if (!ourLevelArr) return;
      const levelStates = ourLevelArr.split(".");
      this.pageId = levelStates[1];
      //this.pageObj = await this.$pouch.get(this.pageId);
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
/* Split pane */
.ar-page {
  height: 100%;
}
.ar-layout {
  height: 100%;
}
.right > div {
  height: 100%;
}
.pane-rs {
  position: unset;
}
.ar-page {
  background: unset;
  padding: 10px;
}
</style>
