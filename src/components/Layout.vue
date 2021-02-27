<template>
  <div v-if="pageObj">
    <div
      v-if="pageObj.divider === 'Vertical' || pageObj.divider === 'Horizontal'"
    >
      <rs-panes
        split-to="pageObj.divider === 'Horizontal' ? 'rows' : 'columns'"
        :allow-resize="true"
        v-on:update:size="paneResizeStop"
        :size="pageSettings ? pageSettings.paneSize : 300"
        :min-size="40"
        resizerColor="#2196f3"
      >
        <!-- Master content -->
        <div slot="firstPane">
          <ar-page
            v-bind:hash-level="hashLevel"
            v-bind:tabs="pageObj.tabs"
            v-bind:page-id="pageObj._id"
          ></ar-page>
        </div>

        <!-- Slave content -->
        <div slot="secondPane" class="right">
          <ar-layout v-bind:level="level + 1"></ar-layout>
        </div>
      </rs-panes>
    </div>
    <div v-else>
      <!-- Single page content -->
      <ar-page
        v-bind:hash-level="hashLevel"
        v-bind:tabs="pageObj.tabs"
        v-bind:page-id="pageObj._id"
      ></ar-page>
    </div>
  </div>
</template>

<script>
/* eslint-disable no-unused-vars */
import ResSplitPane from "vue-resize-split-pane";

export default {
  name: "ar-layout",
  components: {
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
      const ourLevelArr = window.location.hash.split("/")[this.hashLevel +1];
      if(!ourLevelArr) return
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
