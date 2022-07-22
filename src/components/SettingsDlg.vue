<script setup lang="ts">
import { ref } from "vue";
import { db } from "~/services/dexieServices";
import { ElMessage } from "element-plus";
import { toggleDark } from "~/composables";
import jp from "jsonpath";

const props = defineProps(["modelValue"]);
let isDark = ref(true);

const populateFromStatic = async () => {
  try {
    const response = await fetch("argonautdb.json");
    const argonautData = await response.json();
    await db.state.clear();
    await db.updatedObjects.clear();
    await db.state.bulkPut(argonautData);
    ElMessage.success("Static File Loaded and Imported");

    location.reload();
  } catch (err) {
    ElMessage({
      showClose: true,
      message: err,
      type: "error",
      duration: 0,
    });
    throw err;
  }
};

const addTestAccounts = async () => {
  //EosServices.addTestAccounts(this.$message);
};

const staticToEos = async () => {};

const cacheToEos = async () => {
  //EosServices.cacheToEos(this.$message);
};

const eraseAllEos = async () => {
  try {
    ElMessage.success("EOS documents table erased");
  } catch (err) {
    ElMessage({
      showClose: true,
      message: err,
      type: "error",
      duration: 0,
    });
    throw err;
  }
};

const testEos = async () => {
  try {
    ElMessage.success("Test function called");
  } catch (err) {
    ElMessage({
      showClose: true,
      message: err,
      type: "error",
      duration: 0,
    });
    throw err;
  }
};

const onReadFilterDownLoad = async () => {
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
};

const randomKey = async () => {
  const characters = "abcdefghijklmnopqrstuvwxyz12345";
  let randomKey = "";
  for (let i = 0; i < 12; i++) {
    randomKey += characters.charAt(
      Math.floor(Math.random() * characters.length)
    );
  }
  alert(randomKey);
};

const testQuery = async () => {
  try {
    const observableResults$ = argoQuery.executeQuery("f41heqslym5e", {
      _id: "bikeshop1111",
    });
    console.log("observableResults:", observableResults$);

    observableResults$.subscribe({
      next: (result) => console.log("Got result:", result),
      error: (error) => console.error(error),
    });
  } catch (err) {
    ElMessage({
      showClose: true,
      message: err,
      type: "error",
      duration: 0,
    });
    throw err;
  }
};

const generatecpp = async () => {
  try {
    const data = await GenerateCpp.GenerateCpp("gzthjuyjca4s");
    const csv_mime_type = "text/cpp";
    const blob = new Blob([data], { type: csv_mime_type });
    const anchor = document.createElement("a");
    anchor.setAttribute("download", "argonautvoya.cpp");
    const url = URL.createObjectURL(blob);
    anchor.setAttribute("href", url);
    anchor.click();
    URL.revokeObjectURL(url);
    ElMessage.success("Cpp Generated");
  } catch (err) {
    ElMessage({
      showClose: true,
      message: err,
      type: "error",
      duration: 0,
    });
    throw err;
  }
};

</script>

<template>

  <ElDialog
    title="Settings"
    :model-value="modelValue"
    @update:modelValue="() => $emit('update:modelValue', false)"
  >

    <ElRow>

      <ElSwitch
        size="small"
        class="ar-left-align"
        v-model="isDark"
        @click="toggleDark()"
        active-text="Dark"
        inactive-text="Light"
      ></ElSwitch>

    </ElRow>

    <ElRow>

      <ElButton type="primary"  :dark="isDark" plain @click="populateFromStatic">
         Poputate Cache From Static
      </ElButton>

    </ElRow>

    <ElRow>

      <ElButton type="primary" :dark="isDark" plain @click="addTestAccounts">
         Add Tests Accounts to EOS
      </ElButton>

    </ElRow>

    <ElRow>

      <ElButton type="primary" :dark="isDark" plain @click="staticToEos">
         From Static to EOS
      </ElButton>

    </ElRow>

    <ElRow>

      <ElButton type="primary" :dark="isDark" plain @click="cacheToEos">
         From Cache to EOS
      </ElButton>

    </ElRow>

    <ElRow>

      <ElButton type="primary" :dark="isDark" plain @click="eraseAllEos">
         Erase Documents Table in EOS
      </ElButton>

    </ElRow>

    <ElRow>

      <ElButton type="primary" :dark="isDark" plain @click="testEos">Call Test Function</ElButton>

    </ElRow>

    <ElRow>

      <ElButton type="primary" :dark="isDark" plain @click="staticToEos">
         Read, Filter, Download
      </ElButton>

    </ElRow>

    <ElRow>

      <ElButton type="primary" :dark="isDark" plain @click="randomKey">Random Key</ElButton>

    </ElRow>

    <ElRow>

      <ElButton type="primary" :dark="isDark" plain @click="testQuery">Test Query</ElButton>

    </ElRow>

    <ElRow>

      <ElButton type="primary" :dark="isDark" plain @click="generatecpp">Generate Cpp</ElButton>

    </ElRow>

  </ElDialog>

</template>

<style scoped>
.ElRow {
  margin-top: 10px;
}
</style>

