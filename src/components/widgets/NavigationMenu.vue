<template>
  <div>
    <el-menu
      default-active="1"
      class="el-menu-vertical-demo"
      unique-opened
      @select="updateNextLevelHashSelectedObjId"
    >
      <el-menu-item index="1">
        <template slot="title">
          <i class="el-icon-s-home"></i>
          <span>Home</span>
        </template>
      </el-menu-item>
      <el-menu-item index="2">
        <i class="el-icon-s-custom"></i>
        <span>Intake</span>
      </el-menu-item>
      <el-submenu index="3">
        <template slot="title">
          <i class="el-icon-user-solid"></i>
          <span>Human Resources</span>
        </template>
        <el-menu-item index="3-1">Onboarding</el-menu-item>
        <el-menu-item index="3-2">Details</el-menu-item>
        <el-menu-item index="3-3">Exit</el-menu-item></el-submenu>
      <el-submenu index="4">
        <template slot="title">
          <i class="el-icon-picture-outline"></i>
          <span>Financial</span>
        </template>
        <el-menu-item index="4-1">Income Statement</el-menu-item>
        <el-menu-item index="4-2">Balance Sheet</el-menu-item>
        <el-menu-item index="4-3">Cash Flow</el-menu-item>
      </el-submenu>
      <el-submenu index="5">
        <template slot="title">
          <i class="el-icon-picture"></i>
          <span>Modeling</span>
        </template>
        <el-menu-item index="4lk3hxyyfac3">Class Model</el-menu-item>
        <el-menu-item index="5-2">Process Model</el-menu-item>
        <el-menu-item index="5-4">Page Model</el-menu-item>
        <el-menu-item index="5-4">Organization</el-menu-item>
      </el-submenu>
    </el-menu>
  </div>
</template>

<script>
export default {
  name: "ar-navigation-menu",
  props: {
    hashLevel: Number,
    viewId: String,
  },
  methods: {
    handleSelect(key, keyPath) {
      console.log(key, keyPath);
    },

    // Insert selectObjId and pageId into next level hash
    updateNextLevelHashSelectedObjId(pageId, keyPath) {
      let hashArr = window.location.hash.split("/");

      let ourPageStateStr = hashArr[this.hashLevel + 1];
      let ourPageStateArr = ourPageStateStr.split(".");
      let ourSelectObjId = ourPageStateArr[0]

      let nextPageStateStr = hashArr[this.hashLevel + 2];
      if (!nextPageStateStr) nextPageStateStr = "";
      let nextPageStateArr = nextPageStateStr.split(".");
      nextPageStateArr[0] = ourSelectObjId;
      if (pageId && nextPageStateArr[1] !== pageId) {
        nextPageStateArr[1] = pageId;
        // Remove tab if there is one. Page find its own tab
        nextPageStateArr.splice(2);
        // Remove erveything that comes after the next level as it no longer valid
        hashArr.splice(this.hashLevel + 3);
      }
      nextPageStateStr = nextPageStateArr.join(".");
      hashArr[this.hashLevel + 2] = nextPageStateStr;
      //TODO remove following levels, fill with defaults
      let hash = hashArr.join("/");
      window.location.hash = hash;
    },
  },
};
</script>

<style scoped>
</style>
