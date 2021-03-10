<template>
  <div v-if="pageObj">

    <!-- Master - Detail content -->
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
    paneResizeStop(paneSize) {
      this.$settings.upsert(this.pageId, (doc) => {
        doc.paneSize = paneSize
        return doc;
      });
    },

    handleHashChange: function () {
      const ourLevelArr = window.location.hash.split("/")[this.hashLevel + 1];
      if (!ourLevelArr) return;
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
.ar-page {
  height: 100%;
}
.ar-layout {
  height: 100%;
}
.right >>> div {
  height: 100%;
}
.pane-rs {
  position: unset;
}
</style>
