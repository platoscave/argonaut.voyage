<template>
  <div id="app">
    <div class="el-main">Main</div>
    <div class="el-footer">
      <i class="el-icon-setting left-align" @click="dialogVisible = true"></i>
      <el-select
        class="left-align"
        size="mini"
        placeholder="Select Network"
        :value="currentNetwork"
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
      <el-select
        class="left-align"
        size="mini"
        placeholder="Select User"
        :value="user"
        @input="updateCurrentUser"
      >
        <el-option
          v-for="user in users"
          :key="user.value"
          :label="user.label"
          :value="user.value"
        >
        </el-option>
      </el-select>
      <div class="right-align">argonaut.one</div>
    </div>
    <settings-dlg :dialog-visible="dialogVisible"> </settings-dlg>
  </div>
</template>

<script>
/* eslint-disable no-unused-vars */
/* eslint-disable no-debugger */
/* eslint-disable no-unused-vars */
/* eslint-disable vue/no-unused-components */

import SettingsDlg from "./components/SettingsDlg.vue";
import networks from "./config/networks.js";

export default {
  name: "App",
  components: {
    SettingsDlg,
  },
  data() {
    return {
      dialogVisible: false,
      networks: Object.keys(networks),
      network: "sandbox",
    };
  },
  pouch: {
    users: {
      /*read user accounts from argonaut*/
      //return {value: 'aaa', value: 'bbb'}
    },
    currentUser: function () {
      return {
        database: "settings",
        selector: { _id: "currentUser" },
        first: true,
      };
    },
    currentNetwork: function () {
      return {
        database: "settings",
        selector: { _id: "currentNetwork" },
        first: true,
      };
    },
  },
  methods: {
    updateCurrentNetwork(value) {
      this.$settings.get("currentNetwork").then((doc) => {
        doc.value = value;
        return this.$settings.put(doc);
      });
    },
    updateCurrentUser(value) {
      this.$settings.get("currentUser").then((doc) => {
        doc.value = value;
        return this.$settings.put(doc);
      });
    },
  },
  mounted: function () {
    /* const myHeaders = new Headers({
      "Content-Type": "application/json",
      Accept: "application/json",
    }); */
    fetch("public/argonaut.json", {
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((res) => {
        console.log(res); // The json object is here

        return res.json();
      })
      .then((json) => {
        console.log(json); // The json object is here
        this.$message({ message: "Data Loaded", type: "succes" });
      })
      .catch((err) => {
        this.$message({ showClose: true, message: err, type: "error" });
      });
    //.then((data) => console.log(data));
    /* this.$pouch.bulkDocs([
      {
        _id: "mittens",
        occupation: "kitten",
        cuteness: 9.0,
      },
      {
        _id: "katie",
        occupation: "kitten",
        cuteness: 7.0,
      },
      {
        _id: "felix",
        occupation: "kitten",
        cuteness: 8.0,
      },
    ]); */
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
.el-main {
  height: calc(100vh - 40px);
}
.el-footer {
  background: #ffffff08;
  border-top-color: #00adff66;
  border-top-width: 1px;
  border-top-style: solid;
  height: 39px;
}
.el-select.left-align.el-select--mini {
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
