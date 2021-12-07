<template>
  <!-- With tabbar -->
  <div v-if="tabs.length > 1">
    <el-tabs :value="selectedTab ? selectedTab : '0'" @tab-click="updateHashWithSelectedTab">
      <el-tab-pane
        v-for="(tab, tabNum) in tabs"
        :key="tabNum.toString()"
        :label="tab.name"
        :name="tabNum.toString()"
      >
        <!-- This tab has widgets -->
        <div class="ar-full-height" v-if="tab.widgets">
          <ar-widget-selector
            :hash-level="hashLevel"
            :widgets="tab.widgets"
          ></ar-widget-selector>
        </div>

        <!-- This tab has a sub-page -->
        <div class="ar-full-height" v-if="tab.pageId">
          <ar-layout :hash-level="hashLevel + 1"></ar-layout>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>

  <!-- No tabbar -->
  <div class="ar-full-height" v-else-if="tabs.length === 1">
    <!-- This tab has widgets -->
    <div class="ar-full-height" v-if="tabs[0].widgets">
      <ar-widget-selector
        :hash-level="hashLevel"
        :widgets="tabs[0].widgets"
      ></ar-widget-selector>
    </div>

    <!-- This tab has a sub-page -->
    <div class="ar-full-height" v-if="tabs[0].pageId">
      <ar-layout :hash-level="hashLevel + 1"></ar-layout>
    </div>
  </div>
</template>

<script>
import { db } from "../services/dexieServices";
import WidgetSelector from "./WidgetSelector.js";
import WidgetMixin from "../lib/widgetMixin";

export default {
  name: "ar-page",
  mixins: [WidgetMixin],
  components: {
    "ar-widget-selector": WidgetSelector,
  },

  props: {
    hashLevel: Number,
    tabs: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      pageId: "",
      selectedTab: "0",
    };
  },

  methods: {
    // Insert tabNum into hash, for our hashLevel
    async updateHashWithSelectedTab(obj) {
      const selectedTab = obj.name;

      // Update the tabNum in pageSettings for this pageId in the settings db
      const updated = await db.settings.update(this.pageId, {
        selectedTab: selectedTab,
      });
      if (!updated) {
        await db.settings.add({
          pageId: this.pageId,
          selectedTab: selectedTab,
        });
      }

      // Update the tabNum in the window location hash
      let hashArr = window.location.hash.split("/");
      let ourPageStateStr = hashArr[this.hashLevel + 1];
      let ourPageStateArr = ourPageStateStr.split(".");
      // if tabNum is '0' remove it from the hash for esthetic reasons
      if (selectedTab === "0" && ourPageStateArr.length === 3)
        ourPageStateArr.splice(2, 1);
      else ourPageStateArr[2] = selectedTab;
      ourPageStateStr = ourPageStateArr.join(".");
      hashArr[this.hashLevel + 1] = ourPageStateStr;
      //TODO remove following levels, fill with defaults
      let hash = hashArr.join("/");
      window.location.hash = hash;
    },

  },

};
</script>
<style scoped>
.el-tabs {
  height: 100%;
}
.el-tab-pane {
  height: 100%;
}
.ar-widget-selector {
  height: 100%;
}
.ar-layout {
  height: 100%;
}
.el-tabs >>> .el-tabs__header {
  margin-left: 10px;
  margin-right: 10px;
  margin-bottom: 0px;
}
.el-tabs >>> .el-tabs__content {
  height: calc(100% - 40px);
  padding: 0px;
  overflow: auto;
  display: block;
  width: 100%;
}
</style>
