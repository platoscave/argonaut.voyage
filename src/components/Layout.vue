<template>
  <div v-if="pageObj">
    <!-- Master - Slave content -->
    <div
      class="ar-full-height"
      v-if="pageObj.divider === 'Vertical' || pageObj.divider === 'Horizontal'"
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
    <div class="ar-full-height" v-else-if="pageObj.divider === 'Studio'">
      <ar-process-model
        class="diagram"
        v-bind:hash-level="hashLevel"
        v-bind:view-id="pageObj.tabs[0].widgets[0].viewId"
      ></ar-process-model>
      <!-- Master content -->
      <div
        class="drawer-left"
        v-bind:hash-level="hashLevel"
        v-bind:tabs="pageObj.tabs"
        v-bind:class="{ 'left-open': leftOpen }"
      >
        <ar-page
          class="drawer-content"
          v-bind:hash-level="hashLevel"
          v-bind:tabs="pageObj.tabs"
        ></ar-page>
        <div class="left-handle" @click="leftOpen = !leftOpen">
          <svg class="handle-icon">
            <use
              xmlns:xlink="http://www.w3.org/1999/xlink"
              :xlink:href="'toolbar-symbols.svg#handle-left'"
            ></use>
          </svg>
        </div>
      </div>

      <!-- Slave content -->
      <div class="drawer-right" v-bind:class="{ 'right-open': rightOpen }">
        <ar-layout
          class="drawer-content"
          :hash-level="hashLevel + 1"
        ></ar-layout>
        <div class="right-handle" @click="rightOpen = !rightOpen">
          <svg class="handle-icon">
            <use
              xmlns:xlink="http://www.w3.org/1999/xlink"
              :xlink:href="'toolbar-symbols.svg#handle-right'"
            ></use>
          </svg>
        </div>
      </div>
    </div>

    <!-- Single page content -->
    <div class="ar-full-height" v-else>
      <ar-page
        class="ar-full-height"
        v-bind:hash-level="hashLevel"
        v-bind:tabs="pageObj.tabs"
      ></ar-page>
    </div>
  </div>
</template>

<script>
/* eslint-disable no-unused-vars */
import ResSplitPane from "vue-resize-split-pane";
import ClassModel from "./widgets/ClassModel.vue";
import ProcessModel from "./widgets/ProcessModel.vue";

export default {
  name: "ar-layout",
  components: {
    "rs-panes": ResSplitPane,
    "ar-class-model": ClassModel,
    "ar-process-model": ProcessModel,
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
/* Studio */
.diagram {
  height: calc(100vh - 40px);
  width: 100%;
  position: absolute;
}
.drawer-left {
  z-index: 10;
  position: absolute;
  left: -300px;
  min-width: 300px;
  transition-property: left;
  transition-duration: 1s;
}
.left-open {
  left: 0px;
}
.drawer-right {
  z-index: 10;
  position: absolute;
  right: -450px;
  width: 450px;
  transition-property: right;
  transition-duration: 1s;
}
.right-open {
  right: 0px;
}
.drawer-content {
  background: #232323db;
  /* background: #232323ab; */
  border-radius: 6px;
  border-style: solid;
  border-width: 1px;
  border-color: #524f4f;
  overflow: auto;
  max-height: calc(100vh - 40px);
}
.drawer-content >>> .el-tree {
  background: unset;
}
.left-handle {
  position: absolute;
  top: calc(50% - 20px);
  left: 100%;
  z-index: 10;
}
.right-handle {
  position: absolute;
  top: calc(50% - 20px);
  right: 100%;
  z-index: 10;
}
.fab {
  position: absolute;
  margin: 10px;
  bottom: 40px;
  right: 0;
  color: #eee;
  background: #e91e63;
  z-index: 20;
}
.handle-icon {
  width: 20px;
  height: 40px;
  fill: #e91e63;
}
.ar-page {
  background: unset;
  padding: 10px;
}
</style>
