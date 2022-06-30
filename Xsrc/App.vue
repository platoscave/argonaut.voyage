<template>
  <div id="app">
    <ar-layout class="ar-main" :hash-level="0"></ar-layout>

    <div class="ar-footer">
      <i
        class="el-icon-setting ar-left-align"
        @click="dialogVisible = true"
      ></i>
      <el-select
        v-if="networkUserObj"
        class="ar-left-align"
        size="mini"
        placeholder="Select Network"
        :value="networkUserObj.currentNetwork"
        @input="updateCurrentNetwork"
      >
        <el-option
          v-for="network in networks"
          :key="network"
          :label="network.name"
          :value="network"
        >
        </el-option>
      </el-select>
      <el-select
        v-if="networkUserObj"
        class="ar-left-align"
        size="mini"
        placeholder="Select User"
        :value="networkUserObj.currentUserId"
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
      <span class="logo ar-right-align">
        Argonaut.Voyage
      </span>
      <el-button
        @click="cancelChanges"
        size="mini"
        type="danger"
        :disabled="!updatedObjectsCount"
        class="ar-right-align"
        >Cancel</el-button
      >
      <el-button
        @click="saveChanges"
        size="mini"
        type="success"
        :disabled="!updatedObjectsCount"
        class="ar-right-align"
        >Send</el-button
      >
    </div>
    <settings-dlg ref="settingsDlg" v-model="dialogVisible"> </settings-dlg>
  </div>
</template>

<script>
import { db } from "./services/dexieServices";
import EosServices from "./services/eosServices";
import { liveQuery } from "dexie";
import networks from "./config/networks.js";
import SettingsDlg from "./components/SettingsDlg.vue";
import Layout from "./components/Layout.vue";
import DfuseServices from "./services/dfuseServices.js"

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
      networkUserObj: {
        currentNetwork: "sandbox",
        currentUserId: "demouser1111",
      },
      updatedObjectsCount: 0,
    };
  },
  subscriptions() {
    return {
      users: liveQuery(() =>
        db.state.where({ classId: "hdt3hmnsaghk" }).sortBy("name")
      ),
      updatedObjectsCount: liveQuery(() => db.updatedObjects.count()),
      networkUserObj: liveQuery(() => db.settings.get("application")),
    };
  },

  methods: {
    async updateCurrentNetwork(currentNetwork) {
      await db.settings.update("application", {
        currentNetwork: currentNetwork,
      });
    },
    async updateCurrentUser(currentUserId) {
      await db.settings.update("application", {
        currentUserId: currentUserId,
      });
    },
    async saveChanges() {
      try {
        await EosServices.saveChanges();
        this.$message({
          message: "Updates sent to EOS",
          type: "success",
        });
      } catch (err) {
        this.$message({ message: err, type: "error", duration: 0 });
        throw err;
      }
    },
    async cancelChanges() {
      try {
        await EosServices.cancelChanges();
        this.$message({
          message: "Changes Rolledback",
          type: "success",
        });
      } catch (err) {
        this.$message({ message: err, type: "error", duration: 0 });
        throw err;
      }
    },
  },

  created: async function() {
    
    const client = await DfuseServices.startWatch()
    console.log(client)
  },
  mounted: async function() {
    // If argonautdb is not filled yet, populate it from the static file
    const count = await db.state.count();
    if (!count) await this.$refs["settingsDlg"].populateFromStatic();

    // See if we can get app settings from the last time we visited this page
    const networkUserObj = await db.settings.get("application");
    if (!networkUserObj)
      db.settings.add({
        pageId: "application",
        currentNetwork: "sandbox",
        currentUserId: "demouser1111",
      });

    if (!window.location.hash)
      window.location.hash = "#/argonautvoya.uhekisbbbjh5";
  },
};
</script>

<style>
/*  Some global styles */
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
body {
  margin: 0px;
  overflow: hidden;
}
.ar-full-height {
  height: 100%;
}
.ar-full-page {
  overflow: auto;
  padding: 20px;
}
.ar-lightgrey-background {
  background-color: #ffffff08;
  padding-left: 15px;
  padding-right: 10px;
  border-radius: 4px;
  border-style: none;
  font-size: 16px;
  line-height: 24px;
  min-height: 24px;
}
/* Various global fixes */

/* Fix message box */
.el-message__content {
  color: #eee !important;
  font-family: Avenir, Helvetica, Arial, sans-serif;
}
/* Fix drop down */
li.el-select-dropdown__item {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  font-size: 16px;
  line-height: 24px;
}
.el-scrollbar {
  background: #232323;
  border-color: #524f4f;
  border-style: solid;
  border-radius: 6px;
  border-width: 1px;
}
/* Fix Tooltip */
div.el-tooltip__popper.is-dark {
  background: #232323;
  border-color: #524f4f;
  border-style: solid;
  border-radius: 6px;
  border-width: 1px;
  color: #eee !important;
  font-family: Avenir, Helvetica, Arial, sans-serif;
  font-size: 16px;
  line-height: 24px;
  z-index: 50000;
}

/* Controls */
.ar-control > input {
  background-color: #ffffff08;
  border-color: #00adff42;
  font-size: 16px;
  height: 24px;
}
.ar-control > input[readonly] {
  border-style: none;
}
label {
  line-height: 24px;
}

.ar-rodiv.ar-control {
  background-color: #ffffff08;
  padding-left: 10px;
  padding-right: 10px;
  border-radius: 4px;
  border-style: none;
  font-size: 16px;
  line-height: 30px;
  margin-right: 10px;
}

/* Dark mode scroll bars */
::-webkit-scrollbar {
  width: 8px;
  height: 3px;
}
::-webkit-scrollbar-button {
  background-color: #666;
}
::-webkit-scrollbar-track {
  background-color: #646464;
}
::-webkit-scrollbar-track-piece {
  background-color: #000;
}
::-webkit-scrollbar-thumb {
  height: 50px;
  background-color: #666;
  border-radius: 3px;
}
::-webkit-scrollbar-corner {
  background-color: #646464;
}
::-webkit-resizer {
  background-color: #666;
}
</style>

<style scoped>
/* Scoped styles */

.ar-main {
  height: calc(100vh - 40px);
  padding: 0px;
  overflow: auto;
  display: block;
  width: 100%;
}
.ar-footer {
  background: #ffffff08;
  border-top-color: #524f4f;
  border-top-width: 1px;
  border-top-style: solid;
  height: 39px;
}
.el-select {
  width: 175px;
}
.el-select >>> .el-input__inner {
  font-size: 16px;
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
.el-button {
  color: black;
  font-weight: bold;
}
.logo {
  font-family: "Courgette", cursive;
  font-weight: bold;
}
</style>
