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
      <el-button type="primary" @click="randomKey">Random Key</el-button>
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
        await this.clearCache()
        await this.$pouch.bulkDocs(argonautData);
        await this.$pouch.createIndex({
          index: {
            fields: ["parentId"],
          },
        });
        await this.$pouch.createIndex({
          index: {
            fields: ["classId"],
          },
        });
        await this.$pouch.createIndex({
          index: {
            fields: ["ownerId"],
          },
        });
        await this.$message({
          message: "Static File Loaded and Imported",
          type: "success",
        });
      } catch (err) {
        console.error(err);
        this.$message({ message: err, type: "error" });
      }
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
  },
};
</script>

