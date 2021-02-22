/* eslint-disable vue/no-unused-components */
<template>
  <div id="app">
    <div class="el-main">Main</div>
    <div class="el-footer">
      <i class="el-icon-setting left-align" @click="dialogVisible = true"></i>
      <el-select
        class="left-align"
        size="mini"
        v-model="network"
        placeholder="Select Network"
      >
        <el-option
          v-for="network in networks"
          :key="network.value"
          :label="network.label"
          :value="network.value"
        >
        </el-option>
      </el-select>
      <el-select
        class="left-align"
        size="mini"
        v-model="user"
        placeholder="Select User"
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
import SettingsDlg from "./components/SettingsDlg.vue";

export default {
  name: "App",
  components: {
    SettingsDlg,
  },
  data() {
    return {
      dialogVisible: false,
      network: "sandbox",
      networks: [],
      user: "demouser1111",
      users: [],
    };
  },
  mounted: function () {
    const myHeaders = new Headers({
      "Content-Type": "application/json",
      Accept: "application/json",
    });
    fetch("./public/argonautDb.json", {
      headers: myHeaders
    })
      .then((res) => {
        return res.json();
      })
      .then((json) => {
        console.log(json); // The json object is here
      })
      .catch((err) => {
        console.log(err);
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
