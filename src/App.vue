<template>
  <div id="app">

    <ar-layout class="ar-main" :hash-level="0"></ar-layout>

    <div class="ar-footer">
      <i class="el-icon-setting ar-left-align" @click="dialogVisible = true"></i>
      <el-select
        class="ar-left-align"
        size="mini"
        placeholder="Select Network"
        :value="currentNetwork ? currentNetwork.value : ''"
        @input="updateCurrentNetwork"
      >
        <el-option
          v-for="network in networks"
          :key="network"
          :label="network"
          :value="network"
        >
        </el-option>
      </el-select>
      <el-select
        class="ar-left-align"
        size="mini"
        placeholder="Select User"
        :value="currentUser ? currentUser.value : ''"
        @input="updateCurrentUser"
      >
        <el-option
          v-for="user in users"
          :key="user._id"
          :label="user.name"
          :value="user._id"
        >
        </el-option>
      </el-select>
      <div class="ar-right-align">argonaut.one</div>
    </div>

    <settings-dlg v-model="dialogVisible"> </settings-dlg>
    
  </div>
</template>

<script>
/* eslint-disable no-unused-vars */
/* eslint-disable no-debugger */
/* eslint-disable no-unused-vars */
/* eslint-disable vue/no-unused-components */

import networks from "./config/networks.js";
import SettingsDlg from "./components/SettingsDlg.vue";
import Layout from "./components/Layout.vue";

export default {
  name: "App",
  components: {
    SettingsDlg,
    "ar-layout": Layout,
  },
  data() {
    return {
      dialogVisible: false,
      networks: Object.keys(networks),
    };
  },
  pouch: {
    users: function () {
      return {
        database: "argonaut",
        selector: {
          /* Add selector for classId = user accounts */
        },
        fields: ["_id", "name"],
        sort: [{ name: "asc" }],
      };
    },
    currentNetwork: function () {
      return {
        database: "settings",
        selector: { _id: "currentNetwork" },
        first: true,
      };
    },
    currentUser: function () {
      return {
        database: "settings",
        selector: { _id: "currentUser" },
        first: true,
      };
    },
  },
  methods: {
    updateCurrentNetwork(value) {
      this.$settings
        .get("currentNetwork")
        .catch((err) => {
          if (err.name === "not_found") {
            return { _id: "currentNetwork", value: value };
          } else
            this.$message({ showClose: true, message: err, type: "error" });
        })
        .then((doc) => {
          doc.value = value;
          return this.$settings.put(doc);
        })
        .catch((err) =>
          this.$message({ showClose: true, message: err, type: "error" })
        );
    },
    updateCurrentUser(value) {
      this.$settings
        .get("currentUser")
        .catch((err) => {
          if (err.name === "not_found") {
            return { _id: "currentUser", value: value };
          } else
            this.$message({ showClose: true, message: err, type: "error" });
        })
        .then((doc) => {
          doc.value = value;
          return this.$settings.put(doc);
        })
        .catch((err) =>
          this.$message({ showClose: true, message: err, type: "error" })
        );
    },
  },
  mounted: function () {
    // fill in default s
    // network, user, home page
  },
};
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
body {
  margin: 0px;
}
.ar-full-height {
  height: 100%;
}
</style>
<style scoped>
.ar-main {
  height: calc(100vh - 40px);
  padding: 0px;
  overflow: auto;
  display: block;
  width: 100%;
}
.ar-footer {
  background: #ffffff08;
  border-top-color: #00adff66;
  border-top-width: 1px;
  border-top-style: solid;
  height: 39px;
}
.el-select {
  width: 120px;
}
.ar-left-align {
  float: left;
  margin-left: 10px;
  position: relative;
  top: 50%;
  -webkit-transform: translateY(-50%);
  -ms-transform: translateY(-50%);
  transform: translateY(-50%);
  line-height: 100%;
}
.ar-right-align {
  float: right;
  margin-right: 10px;
  position: relative;
  top: 50%;
  -webkit-transform: translateY(-50%);
  -ms-transform: translateY(-50%);
  transform: translateY(-50%);
  line-height: 100%;
}
</style>
