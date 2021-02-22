<template>
  <el-dialog
    title="Tips"
    :visible.sync="dialogVisible"
    width="30%"
    :before-close="handleClose"
  >
    <span>This is a message</span>
    <span slot="footer" class="dialog-footer">
      <el-button @click="dialogVisible = false">Cancel</el-button>
      <el-button type="primary" @click="dialogVisible = false"
        >Confirm</el-button
      >
    </span>
  </el-dialog>
</template>

<script>
export default {
  name: "settings-dlg",
  props: {
    dialogVisible: Boolean,
  },
  methods: {
    handleClose() {
      /* this.$confirm("Are you sure to close this dialog?")
        .then(() => {
          done();
        })
        .catch(() => {}); */
    },
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped >
</style>
