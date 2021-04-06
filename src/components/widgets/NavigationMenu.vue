<template>
  <div>
    <el-radio-group v-model="isCollapse" style="margin-bottom: 20px">
      <el-radio-button :label="false">expand</el-radio-button>
      <el-radio-button :label="true">collapse</el-radio-button>
    </el-radio-group>
    <el-menu
      default-active="1"
      class="el-menu-vertical-demo"
      :collapse="isCollapse"
      @select="handleSelect"
      @open="handleOpen"
      @close="handleClose"
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
        <el-menu-item index="5-1">Class Model</el-menu-item>
        <el-menu-item index="5-2">Process Model</el-menu-item>
        <el-menu-item index="5-4">Page Model</el-menu-item>
        <el-menu-item index="5-4">Organization</el-menu-item>
      </el-submenu>
    </el-menu>
  </div>

  <!-- 
        <el-menu-item-group title="Group One">
          <el-menu-item index="1-1">item one</el-menu-item>
          <el-menu-item index="1-2">item one</el-menu-item>
        </el-menu-item-group>
        <el-menu-item-group title="Group Two">
          <el-menu-item index="1-3">item three</el-menu-item>
        </el-menu-item-group>
        <el-submenu index="1-4">
          <template slot="title">item four</template>
          <el-menu-item index="1-4-1">item one</el-menu-item>
        </el-submenu>

   -->
</template>

<script>
export default {
  name: "ar-navigation-menu",
  props: {
    hashLevel: Number,
    viewId: String,
  },
  data() {
    return {
      isCollapse: true,
    };
  },
  methods: {
    handleOpen(key, keyPath) {
      console.log(key, keyPath);
    },
    handleClose(key, keyPath) {
      console.log(key, keyPath);
    },
    handleSelect(key, keyPath) {
      console.log(key, keyPath);
    },
  },
};
</script>

<style scoped>
    .icon {
       width: 1em; height: 1em;
       vertical-align: -0.15em;
       overflow: hidden;
    }
i {
       fill: currentColor;
  color: #eee
}
.el-menu-vertical-demo:not(.el-menu--collapse) {
  width: 200px;
  min-height: 400px;
}
</style>
