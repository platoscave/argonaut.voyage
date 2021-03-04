<template>
  <el-dialog
    title="Settings"
    :visible.sync="value"
    width="30%"
    :before-close="() => $emit('input', false)"
  >
    <el-button type="primary" @click="clearCache">Clear Cache</el-button>
    <el-button type="primary" @click="populateFromStatic"
      >Poputate Cache From Static</el-button
    >
  </el-dialog>
</template>

<script>
//import argo from '../../assets/argonaut.json'
//import argo from './argonaut.js'
//const argo = require("./argonaut.json")

export default {
  name: "settings-dlg",
  props: {
    value: Boolean,
  },
  data() {
    return {
      publicPath: process.env.BASE_URL,
    };
  },
  methods: {
    clearCache() {
      this.$argonaut
        .destroy()
        .then(function () {
          this.$message({ message: "Cache Cleared", type: "succes" });
        })
        .catch(function (err) {
          this.$message({ message: err, type: "error" });
        });
    },
    populateFromStatic() {
      function reqListener() {
        console.log(this.responseText);
      }

      var oReq = new XMLHttpRequest();
      oReq.addEventListener("load", reqListener);
      oReq.open("GET", "http://localhost:8080/argonaut.json");
      oReq.send();
      // cat get fetch to work, webpack server
      /* const url = "http://localhost:8080/public/argonaut.json";
      fetch(url)
        .then((res) => {
          return res.json();
        })
        .then((json) => {
          console.log(json); // The json object is here
          this.$message({ message: "Data Loaded", type: "succes" });
        })
        .catch((err) => {
          this.$message({
            showClose: true,
            message: err,
            type: "error",
            duration: 0,
          });
        }); */
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
  },
};
</script>

