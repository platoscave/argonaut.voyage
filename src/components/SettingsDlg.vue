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
export default {
  name: "settings-dlg",
  props: {
    value: Boolean,
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
      /* const myHeaders = new Headers({
      "Content-Type": "application/json",
      Accept: "application/json",
    }); */
      fetch("public/argonaut.json", { redirect: "error" })
        .then((res) => {
          console.log(res); // The json object is here

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
  },
};
</script>

