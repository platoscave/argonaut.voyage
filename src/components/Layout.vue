<template>
  <div
    v-if="pageObj.divider === 'Vertical' || pageObj.divider === 'Horizontal'"
  >
    <rs-panes
      split-to="columns"
      :allow-resize="true"
      v-on:update:size="paneResizeStop"
      :size="pageSettings ? pageSettings.paneSize : 300"
      :min-size="40"
      resizerColor="#2196f3"
    >
      <!-- Master content -->
      <div slot="firstPane">
        <!-- <ar-page
          v-bind:level="level"
          v-bind:tabs="pageObj.tabs"
          v-bind:pageId="pageObj.key"
        ></ar-page> -->
      </div>
      <!-- Slave content -->
      <div slot="secondPane" class="right">
        <!-- <ar-layout v-bind:level="level + 1"></ar-layout> -->
      </div>
    </rs-panes>
  </div>
  <div v-else>
    <!-- Single page content -->
    <!-- <ar-page
      v-bind:level="level"
      v-bind:tabs="pageObj.tabs"
      v-bind:pageId="pageObj.key"
    ></ar-page> -->
  </div>
</template>

<script>
/* eslint-disable no-unused-vars */

//import Layout from './Layout.vue'
//import Tabs from './Page.vue'
import ResSplitPane from "vue-resize-split-pane";
export default {
  name: "ar-layout",
  components: {
    //Layout,
    //Page,
    "rs-panes": ResSplitPane,
  },
  props: {
    hashLevel: Number,
  },
  data() {
    return {
      pageId: null,
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
    paneResizeStop(pane, resizer, size) {
      this.$settings
        .get(this.pageId)
        .catch((err) => {
          if (err.name === "not_found") {
            return { _id: this.pageId, paneSize: size };
          } else
            this.$message({ showClose: true, message: err, type: "error" });
        })
        .then((doc) => {
          doc.paneSize = size;
          return this.$settings.put(doc);
        })
        .catch((err) =>
          this.$message({ showClose: true, message: err, type: "error" })
        );
    },
    handleHashChange: function () {
      const hash = window.location.hash.split("#/")[1];
      const ourLevelArr = hash.split("/")[this.hashLevel];
      const levelStates = ourLevelArr.split(".");
      this.pageId = levelStates[1];
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
.pane-rs {
  position: unset;
}
</style>
