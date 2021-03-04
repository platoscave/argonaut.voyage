<template>
  <div id="app">
    <ar-layout class="ar-main" :hash-level="0"></ar-layout>

    <div class="ar-footer">
      <i
        class="el-icon-setting ar-left-align"
        @click="dialogVisible = true"
      ></i>
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

import argo from "./config/argonautstatic.js";
import argo2 from "./src/assets/argonaut.json";
import networks from "./config/networks.js";
import SettingsDlg from "./components/SettingsDlg.vue";
import Layout from "./components/Layout.vue";

if(argo2) console.log(argo2)

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
      this.$settings.upsert("currentNetwork", (doc) => {
        return { value: value };
      });
    },
    updateCurrentUser(value) {
      this.$settings.upsert("currentUser", (doc) => {
        return { value: value };
      });
    },
  },

  mounted: function () {
    // fill in defaults for new users. Put will fail if record exsits
    this.$settings
      .put({ _id: "currentNetwork", value: "sandbox" })
      .catch(()=>{});// dont care if this fails
    this.$settings
      .put({ _id: "currentUser", value: "demouser1111" })
      .catch(()=>{});// dont care if this fails

    if(!window.location.hash) window.location.hash = '#/.mbatzlqr1qsx.3'
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
.el-message__content {
  color: #eee !important;
  font-family: Avenir, Helvetica, Arial, sans-serif;
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
