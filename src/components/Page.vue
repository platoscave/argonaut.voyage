<template>
  <div v-if="tabs.length > 1">
    <el-tabs
      :value="pageSettings ? pageSettings.selectedTab : '0'"
      @input="updateHashWithSelectedTab"
    >
        <el-tab-pane v-for="(tab, tabNum) in tabs" :key="tabNum.toString()" :label="tab.name" :name="tabNum.toString()">
          <!-- This tab has widgets -->
          <div v-if="tab.widgets">
            <ar-widgets
            class="ar-child"
            :hash-level="hashLevel"
            :widgets="tab.widgets"
          ></ar-widgets>
          </div>
          <!-- This tab has a sub-page -->
          <div v-if="tab.pageId"> 
            <ar-layout :hash-level="hashLevel + 1"></ar-layout>
          </div>
        </el-tab-pane>
    </el-tabs>
  </div>
  <div v-else-if="tabs.length > 0">
    <!-- This tab has widgets -->
    <div v-if="tabs[0].widgets" class="full-height">
      <ar-widgets
        :hash-level="hashLevel"
        :widgets="tabs[0].widgets"
      ></ar-widgets>
    </div>
    <!-- This tab has a sub-page -->
    <div v-if="tabs[0].pageId">
      <ar-layout :hash-level="hashLevel + 1"></ar-layout>
    </div>
  </div>
</template>

<script>

/* eslint-disable no-unused-vars */
/* eslint-disable vue/no-unused-components */

import Widgets from "./Widgets.js";

export default {
  name: "ar-page",
  components: {
    'ar-widgets': Widgets
  },
  props: {
    hashLevel: Number,
    pageId: String,
    tabs: {
      type: Array,
      default: () => [],
    },
  },
  pouch: {
    pageSettings: function () {
      return {
        database: "settings",
        selector: { _id: this.pageId },
        first: true,
      };
    },
  },
  methods: {

    // Insert tabNum into hash, for our hashLevel
    updateHashWithSelectedTab(tabNum) {
      let hashArr = window.location.hash.split("/");
      let ourPageStateStr = hashArr[this.hashLevel +1];
      let ourPageStateArr = ourPageStateStr.split(".");
      if(tabNum === '0' && ourPageStateArr.length === 3) ourPageStateArr.splice(2, 1)
      else ourPageStateArr[2] = tabNum
      ourPageStateStr = ourPageStateArr.join('.')
      hashArr[this.hashLevel +1] = ourPageStateStr
      let hash  = hashArr.join('/')
      window.location.hash = hash
    },

    handleHashChange() {
      // If the hash provides a tabNum, use it to set pageSettings for this pageId in the settings db
      // This will then be refected in the pageSettings object under pouch
      const ourLevelArr = window.location.hash.split("/")[this.hashLevel + 1];
      if(!ourLevelArr) return
      let selectedTab = ourLevelArr.split(".")[2];
      if(!selectedTab) selectedTab = '0'

      // Set the selectedTab in pageSetting for this pageId in the settings db
      this.$settings
        .get(this.pageId)
        .catch((err) => {
          if (err.name === "not_found") {
            return { _id: this.pageId, selectedTab: selectedTab };
          } else
            this.$message({ showClose: true, message: err, type: "error" });
        })
        .then((doc) => {
          doc.selectedTab = selectedTab;
          return this.$settings.put(doc);
        })
        .catch((err) =>
          this.$message({ showClose: true, message: err, type: "error" })
        );
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
.ar-parent {
  height: calc(100vh - 40px);
  padding: 0px;
  overflow: auto;
  display: block;
  width: 100%;
}
.ar-child {
  height: 100%;
}
</style>
