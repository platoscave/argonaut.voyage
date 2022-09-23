<script setup lang="ts">
import { ref, watch } from "vue";
import { db } from "~/services/dexieServices";
import useArgoQuery from "~/composables/useArgoQuery";
import { ElMessage } from "element-plus";
import { toggleDark } from "~/composables";
import jp from "jsonpath";
import { ifError } from "assert";

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
      duration: 5000,
    });
    throw err;
  }
};

const saveToStatic = async () => {
  const fullData = await db.state.toArray();
  // const ts = Math.floor(Date.now() / 1000)

  const jsonString = JSON.stringify(fullData, null, 2);
  const csv_mime_type = "text/json";
  const blob = new Blob([jsonString], { type: csv_mime_type });
  const anchor = document.createElement("a");
  anchor.setAttribute("download", "argonautdb.json");
  const url = URL.createObjectURL(blob);
  anchor.setAttribute("href", url);
  anchor.click();
  URL.revokeObjectURL(url);
  document.removeChild(anchor);
}

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
      duration: 5000,
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
      duration: 5000,
    });
    throw err;
  }
};

const onReadFilterDownLoad = async () => {
  debugger
  const response = await fetch("argonautdb.json");
  const argonautData = await response.json();
  const updatedDb = []
  let count = 0


  argonautData.forEach( item => {
    if(item.classIcon || item.nodesIcon) {
      setTimeout(() => {
        //downloadFileWithAnchor();

        let iconName = ''
        let markup = ''

        if(item.classIcon) iconName = item.title.replace(/\s+/g, '');
        else iconName = item.name.replace(/\s+/g, '');

        //if(item.icon) markup = ''
        if(item.classIcon) markup = item.classIcon.slice(24); // remove data:image/svg+xml;utf8,
        if(item.nodesIcon) markup = item.nodesIcon.slice(24); // remove data:image/svg+xml;utf8,

        const svgData = decodeURIComponent(markup);

        var svgBlob = new Blob([svgData], {type:"image/svg+xml;charset=utf-8"});
        var svgUrl = URL.createObjectURL(svgBlob);
        var downloadLink = document.createElement("a");
        downloadLink.href = svgUrl;
        downloadLink.download = iconName + ".svg";
        document.body.appendChild(downloadLink);
        //downloadLink.click();
        document.body.removeChild(downloadLink);
        


        // if(item.icon) item.icon = iconName
        // if(item.classIcon) item.classIcon = iconName
        // if(item.nodesIcon) item.nodesIcon = iconName

        console.log('iconName', iconName)

      },count * 200 );
      count ++
      //updatedDb.push(item)
    }
  })
  console.log('count', count)

  // const jsonString = JSON.stringify(updatedDb, null, 2);
  // const csv_mime_type = "text/json";
  // const blob = new Blob([jsonString], { type: csv_mime_type });
  // const anchor = document.createElement("a");
  // anchor.setAttribute("download", "argonautdb.json");
  // const url = URL.createObjectURL(blob);
  // anchor.setAttribute("href", url);
  // anchor.click();
  // URL.revokeObjectURL(url);
};

const randomKey = async () => {
  const characters = "abcdefghijklmnopqrstuvwxyz12345";
  let randomKey = "";
  for (let i = 0; i < 12; i++) {
    randomKey += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  alert(randomKey);
};

const testQuery = async () => {
  try {
    const resultsRef = useArgoQuery(
      { extendTo: "Owned Accounts" },
      {
        _id: "bikeshop1111",
      }
    );

    watch(resultsRef, (resultsRef) => console.log("resultsRef", resultsRef));
  } catch (err) {
    ElMessage({
      showClose: true,
      message: err,
      type: "error",
      duration: 5000,
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
      duration: 5000,
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
      <ElButton type="primary" :dark="isDark" plain @click="populateFromStatic">
        Poputate Cache From Static
      </ElButton>
    </ElRow>

    <ElRow>
      <ElButton type="primary" :dark="isDark" plain @click="saveToStatic">
        Save to Static
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
      <ElButton type="primary" :dark="isDark" plain @click="testEos"
        >Call Test Function</ElButton
      >
    </ElRow>

    <ElRow>
      <ElButton type="primary" :dark="isDark" plain @click="onReadFilterDownLoad">
        Read, Filter, Download
      </ElButton>
    </ElRow>

    <ElRow>
      <ElButton type="primary" :dark="isDark" plain @click="randomKey"
        >Random Key</ElButton
      >
    </ElRow>

    <ElRow>
      <ElButton type="primary" :dark="isDark" plain @click="testQuery"
        >Test Query</ElButton
      >
    </ElRow>

    <ElRow>
      <ElButton type="primary" :dark="isDark" plain @click="generatecpp"
        >Generate Cpp</ElButton
      >
    </ElRow>
  </ElDialog>
</template>

<style scoped>
.el-row {
  margin-top: 4px;
}
</style>
