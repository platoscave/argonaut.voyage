<template>
  <div id="app">
    <div class="ar-parent">
      <ar-layout class="ar-child" :hash-level="0"></ar-layout>
    </div>
    <div class="ar-footer">
      <i class="el-icon-setting left-align" @click="dialogVisible = true"></i>
      <el-select
        class="left-align"
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
      <el-button @click="test">test</el-button>
      <!--  :value="currentUser.value" -->
      <el-select
        class="left-align"
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
      <div class="right-align">argonaut.one</div>
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
    test: function () {
      this.$databases.argonaut.put({
        _id: "mbatzlqr1qsx",
        docType: "object",
        name: "Resources Page",
        accordionOrTab: "Tabs",
        classId: "pejdgrwd5qso",
        divider: "None",
        ownerId: "eoscommonsio",
        tabs: [
          {
            name: "Details",
            widgets: [
              {
                displayType: "Form",
                name: "Details",
                viewId: "mairnfr3iilv",
              },
            ],
          },
          {
            name: "Teams",
            pageId: "kmghbh3qovtq",
          },
          {
            name: "Off Balance Sheet",
            pageId: "1xiosn5ttuea",
          },
          {
            name: "Balance Sheet",
            widgets: [
              {
                displayType: "Balance Sheet",
                name: "Balance Sheet",
              },
            ],
          },
          {
            name: "Backlog",
            pageId: "1us2bjzz2i3h",
          },
        ],
      });
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
</style>
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
.left-align {
  float: left;
  margin-right: 10px;
  position: relative;
  top: 50%;
  -webkit-transform: translateY(-50%);
  -ms-transform: translateY(-50%);
  transform: translateY(-50%);
  line-height: 100%;
}
.right-align {
  float: right;
  margin-left: 10px;
  position: relative;
  top: 50%;
  -webkit-transform: translateY(-50%);
  -ms-transform: translateY(-50%);
  transform: translateY(-50%);
  line-height: 100%;
}
</style>
