<template>
  <el-dialog
    title="Settings"
    :visible.sync="value"
    width="30%"
    :before-close="() => $emit('input', false)"
  >
    <el-row>
      <el-button type="primary" @click="populateFromStatic"
        >Poputate Cache From Static</el-button
      >
    </el-row>
    <el-row>
      <el-button type="primary" @click="addTestAccounts"
        >Add Tests Accounts to EOS</el-button
      >
    </el-row>
    <el-row>
      <el-button type="primary" @click="staticToEos"
        >From Static to EOS</el-button
      >
    </el-row>
    <el-row>
      <el-button type="primary" @click="cacheToEos"
        >From Cache to EOS</el-button
      >
    </el-row>
    <el-row>
      <el-button type="primary" @click="eraseAllEos"
        >Erase Documents Table in EOS</el-button
      >
    </el-row>
    <el-row>
      <el-button type="primary" @click="testEos">Call Test Function</el-button>
    </el-row>
    <el-row>
      <el-button type="primary" @click="staticToEos"
        >Read, Filter, Download</el-button
      >
    </el-row>
    <el-row>
      <el-button type="primary" @click="randomKey">Random Key</el-button>
    </el-row>
    <el-row>
      <el-button type="primary" @click="testQuery">Test Query</el-button>
    </el-row>
    <p></p>
    <el-row>
      <el-button type="primary" @click="generatecpp">Generate Cpp</el-button>
    </el-row>
  </el-dialog>
</template>

<script>
import { db, argoQuery } from "../services/dexieServices";
import EosServices from "../services/eosServices";
import GenerateCpp from "../services/generateCpp";

export default {
  name: "settings-dlg",
  props: {
    value: Boolean,
  },

  methods: {
    async populateFromStatic() {
      try {
        const response = await fetch("argonautdb.json");
        const argonautData = await response.json();
        await db.state.clear();
        await db.state.bulkPut(argonautData);
        this.$message({
          message: "Static File Loaded and Imported",
          type: "success",
        });
        // reload page
        location.reload();
      } catch (err) {
        console.error(err);
        this.$message({ message: err, type: "error" });
      }
    },

    async addTestAccounts() {
      EosServices.addTestAccounts(this.$message);
    },

    async staticToEos() {
      EosServices.staticToEos(this.$message);
    },

    async cacheToEos() {
      EosServices.cacheToEos(this.$message);
    },

    async eraseAllEos() {
      try {
        await EosServices.eraseAllEos();
        this.$message({
          message: "EOS documents table erased",
          type: "success",
        });
      } catch (err) {
        this.$message({ message: err, type: "error" });
      }
    },

    async testEos() {
      try {
        const response = await fetch("testObject.json");
        const testObject = await response.json();
        await EosServices.testEos(testObject);
        this.$message({ message: "Test function called", type: "success" });
      } catch (err) {
        this.$message({ message: err, type: "error" });
      }
    },

    async onReadFilterDownLoad() {
      // https://stackoverflow.com/questions/54793997/export-indexeddb-object-store-to-csv
      //const data = await IndexedDBApiService.GetAll(this.$store);

      const response = await fetch("argonautdb.json");
      const argonautData = await response.json();

      const processClasses = [
        "cq4bjkzqc2qp",
        "xsaq3l5hncb2",
        "dqja423wlzrb",
        "jotxozcetpx2",
        "1jrqyjoabx1a",
        "s41na42wsxez",
        "dwl1kwhalwj4",
      ];
      const filterData = argonautData.filter((item) => {
        return processClasses.includes(item.classId);
      });

      const jsonString = JSON.stringify(filterData, null, 2);
      const csv_mime_type = "text/json";
      const blob = new Blob([jsonString], { type: csv_mime_type });
      const anchor = document.createElement("a");
      anchor.setAttribute("download", "argonautFiltered.json");
      const url = URL.createObjectURL(blob);
      anchor.setAttribute("href", url);
      anchor.click();
      URL.revokeObjectURL(url);
    },
    randomKey() {
      const characters = "abcdefghijklmnopqrstuvwxyz12345";
      let randomKey = "";
      for (let i = 0; i < 12; i++) {
        randomKey += characters.charAt(
          Math.floor(Math.random() * characters.length)
        );
      }
      alert(randomKey);
    },
    async testQuery() {
      try {
        const observableResults = await argoQuery.executeQuery({
          selector: {
            classId: "hdt3hmnsaghk",
          },
          sort : 'name'
        });
        observableResults.subscribe({
          next: (result) => console.log("Got result:", result),
          error: (error) => console.error(error),
        });
        this.$message({
          message: "Success",
          type: "success",
        });
      } catch (err) {
        console.error(err);
        this.$message({ message: err, type: "error" });
      }
    },
    async generatecpp() {
      try {
        const data = await GenerateCpp.GenerateCpp(this.$store);
        const csv_mime_type = "text/cpp";
        const blob = new Blob([data], { type: csv_mime_type });
        const anchor = document.createElement("a");
        anchor.setAttribute("download", "commons.cpp");
        const url = URL.createObjectURL(blob);
        anchor.setAttribute("href", url);
        anchor.click();
        URL.revokeObjectURL(url);
        this.$message({ message: "Cpp Generated", type: "success" });
      } catch (err) {
        console.error(err);
        this.$message({ message: err, type: "error" });
      }
    },
  },
};
</script>
<style scoped>
.el-row {
  margin-top: 10px;
}
.el-button--primary {
  color: black;
}
</style>
