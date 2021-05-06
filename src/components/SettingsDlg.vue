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
      <el-button type="primary" @click="onReadFilterDownLoad"
        >Read Filter Doenload</el-button
      >
    </el-row>
    <el-row>
      <el-button type="primary" @click="randomKey">Random Key</el-button>
    </el-row>
    <el-row>
      <el-button type="primary" @click="testQuery">Test Query</el-button>
    </el-row>
  </el-dialog>
</template>

<script>
export default {
  name: "settings-dlg",
  props: {
    value: Boolean,
  },

  methods: {
    async clearCache() {
      try {
        await this.$pouch.destroy();
        this.$message({ message: "Cache Cleared", type: "success" });
      } catch (err) {
        this.$message({ message: err, type: "error" });
      }
    },
    async populateFromStatic() {
      try {
        const response = await fetch("argonaut.json");
        const argonautData = await response.json();
        await this.clearCache();
        await this.$pouch.bulkDocs(argonautData);
        await this.$pouch.createIndex({
          index: {
            fields: ["parentId", "title"],
          },
        });
        await this.$pouch.createIndex({
          index: {
            fields: ["classId", "name"],
          },
        });
        await this.$pouch.createIndex({
          index: {
            fields: ["ownerId", "name"],
          },
        });
        this.$message({
          message: "Static File Loaded and Imported",
          type: "success",
        });
      } catch (err) {
        console.error(err);
        this.$message({ message: err, type: "error" });
      }
    },
    async onReadFilterDownLoad() {
      // https://stackoverflow.com/questions/54793997/export-indexeddb-object-store-to-csv
      //const data = await IndexedDBApiService.GetAll(this.$store);

      const response = await fetch("argonaut.json");
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
        /* 
        {
          "$and": [
            { "classId": "pejdgrwd5qso" },
            { "_id": {"$gt": null} },
            { "_id": {"$exists": true} },
            { "name": {"$gt": null} },
            { "name": {"$exists": true} }
          ]
        }
        */

        const res = await this.$pouch.find({
          database: "argonaut",
          selector: { classId: "hdt3hmnsaghk" },
          fields: ["_id", "name"],
          //sort: ["name"],
        });
        console.log(res);
        this.$message({
          message: "Static File Loaded and Imported",
          type: "success",
        });
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


