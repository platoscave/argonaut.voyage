<template>
  <div v-if="tabs.length > 1">
    <el-tabs
      v-model="pageSettings.selectedTab"
      v-for="(tab, n) in tabs"
      :key="n"
    >
      <el-tab-pane :label="tab.name" :name="n">
        <!-- This tab has widgets -->
        <div v-if="tab.widgets">
          <ar-widgets
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
//must be declared globally
// import EcLayout from "./Layout.vue";
//import Widgets from "./Widgets.vue";

export default {
  name: "ar-page",
  components: {
    //Widgets
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
  computed: {
    selectedTab: {
      get() {
        let pageStates = this.$store.state.pageStates[this.pageId];
        if (pageStates && pageStates.selectedTab) return pageStates.selectedTab;
        return 0;
      },
      set(value) {
        this.$store.commit("SET_PAGE_STATE2", {
          level: this.level,
          pageId: this.pageId,
          selectedTab: value,
          nextLevel: {
            pageId: this.tabs[value].pageId,
          },
        });
      },
    },
  },
  created: {},
};
</script>
<style scoped>
/* >>> .v-window {
  height: calc(100% - 48px);
}
>>> .v-window__container {
  height: 100%;
} */
</style>
