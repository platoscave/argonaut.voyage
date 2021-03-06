<template>
  <el-dialog
    title="Settings"
    :visible.sync="value"
    width="30%"
    :before-close="() => $emit('input', false)"
  >
    <el-row>
      <el-button type="primary" @click="clearCache">Clear Cache</el-button>
    <el-row>
    </el-row>
      <el-button type="primary" @click="populateFromStatic"
        >Poputate Cache From Static</el-button
      >
    </el-row>
  </el-dialog>
</template>

<script>
import argo from "../assets/argonautstatic.js";

export default {
  name: "settings-dlg",
  props: {
    value: Boolean,
  },

  methods: {
    clearCache() {
      this.$pouch
        .destroy()
        .then( () => {
          this.$message({ message: "Cache Cleared", type: "succes" });
        })
        .catch( err => {
          this.$message({ message: err, type: "error", duration:"0"});
        });
    },

    populateFromStatic() {
      this.$pouch
        .bulkDocs(argo)
        .then(() => {
          this.$message({ message: "Static File Loaded", type: "succes" });
        })
        .catch(function (err) {
          this.$message({ message: err, type: "error" });
        });

      this.$pouch
        .createIndex({
          index: {
            fields: ["parentId"],
          },
        })
        .then(() => {
          this.$message({ message: "Index Created: parentId", type: "succes" });
        })
        .catch((err) => {
          this.$message({ message: err, type: "error" });
        });

      this.$pouch
        .createIndex({
          index: {
            fields: ["classId"],
          },
        })
        .then(() => {
          this.$message({ message: "Index Created: classId", type: "succes" });
        })
        .catch((err) => {
          this.$message({ message: err, type: "error" });
        });

      this.$pouch
        .createIndex({
          index: {
            fields: ["ownerId"],
          },
        })
        .then(() => {
          this.$message({ message: "Index Created: ownerId", type: "succes" });
        })
        .catch((err) => {
          this.$message({ message: err, type: "error" });
        });
    },
  },
};
</script>

