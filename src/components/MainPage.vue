<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { db } from "~/services/dexieServices";
import useLiveQuery from "../lib/useLiveQuery";
//import EosServices from "~/services/eosServices";
// import { liveQuery } from "dexie";
// import { useSubscription } from '@vueuse/rxjs'
// import { interval } from 'rxjs'
import networks from "~/config/networks.js";
import toolbarSymbols from "~/assets/toolbar-symbols.svg";
import { ElMessage } from 'element-plus'

const dialogVisible = ref(false);
const settingsDlg = ref(null)

// we have a single record in settings db that holds the current network and userid
interface networkUserRec {
  currentNetwork: string
  currentUserId: string
  pageId: string
}
let networkUserObj = useLiveQuery<networkUserRec>(
  () => db.settings.get("application"), []
)

//get all objects of type users
interface userRec {
  _id: string
  name: string
}
const users = useLiveQuery<userRec>(
  () => db.state.where({ classId: "hdt3hmnsaghk" }).sortBy("name"), []
)

// We use the count of updatedObjects to dis/enable cancel save buttons
const updatedObjectsCount = useLiveQuery<number>(
  () => db.updatedObjects.count(), []
)

const updateCurrentNetwork = async (currentNetwork) => {
  debugger
  await db.settings.update("application", {
    currentNetwork: currentNetwork,
  });
};

const updateCurrentUser = async (currentUserId) => {
  await db.settings.update("application", {
    currentUserId: currentUserId,
  });
};

const saveChanges = async () => {
  try {
    ElMessage.success("Updates sent to EOS")
  } catch (err) {
    ElMessage({
      showClose: true,
      message: err,
      type: 'error',
      duration: 0 
    })
    throw err;
  }
};

const cancelChanges = async () => {
  try {
    //await EosServices.cancelChanges();
    ElMessage.success("Changes Undone")
  } catch (err) {
    ElMessage({
      showClose: true,
      message: err,
      type: 'error',
      duration: 0 
    })
    throw err;
  }
};



onMounted( async () => {
    // If argonautdb is not filled yet, populate it from the static file
    const count = await db.state.count();
    if (!count) await settingsDlg.value.populateFromStatic();

    // See if we can get app settings from the last time we visited this page
    const networkUserObj = await db.settings.get("application");
    if (!networkUserObj)
      db.settings.add({
        pageId: "application",
        currentNetwork: "sandbox",
        currentUserId: "demouser1111",
      });

    if (!window.location.hash)
      window.location.hash = "#/argonautvoya.uhekisbbbjh5";
})
</script>

<template>

  <div id="app">

    <Layout class="ar-main" :hash-level="0"></Layout> 
    <!-- <div class="ar-main" ></div>-->

    <div class="ar-footer">

      <svg class="ar-left-align settings-icon" height="24" width="24" color="blue" @click="dialogVisible = true">

        <use
          xmlns:xlink="http://www.w3.org/1999/xlink"
          :xlink:href="'toolbar-symbols.svg#settings'"
        ></use>

      </svg>

      
        <el-select
        v-if="networkUserObj"
        class="ar-left-align"
        size="small"
        placeholder="Select Network"
        :model-value="networkUserObj.currentNetwork"
        @change="updateCurrentNetwork"
      >

        <el-option
          v-for="network in networks"
          :key="network"
          :label="network.name"
          :value="network.name"
        >

        </el-option>

      </el-select>

      <el-select
        v-if="networkUserObj"
        class="ar-left-align"
        size="small"
        placeholder="Select User"
        :model-value="networkUserObj.currentUserId"
        @change="updateCurrentUser"
      >

        <el-option
          v-for="userObj in users"
          :key="userObj._id"
          :label="userObj.name"
          :value="userObj._id"
        >

        </el-option>

      </el-select>
<!---->

      <span class="logo ar-right-align"> Argonaut.Voyage </span>

      <el-button
        @click="cancelChanges"
        size="small"
        type="danger"
        :disabled="!updatedObjectsCount"
        class="ar-right-align"
      >
         Cancel
      </el-button>

      <el-button
        @click="saveChanges"
        size="small"
        type="success"
        :disabled="!updatedObjectsCount"
        class="ar-right-align"
      >
         Send
      </el-button>

    </div>

   
    <SettingsDlg ref="settingsDlg" v-model="dialogVisible"> </SettingsDlg>


  </div>

</template>

<style>
#appX {
  text-align: center;
  color: var(--ep-text-color-primary);
}
</style>

<style scoped>
/* Scoped styles */

.ar-main {
  height: calc(100vh - 40px);
  padding: 0px;
  overflow: auto;
  display: block;
  width: 100%;
}
.ar-footer {
  background: #ffffff08;
  border-top-color: #524f4f;
  border-top-width: 1px;
  border-top-style: solid;
  height: 39px;
}
.el-select {
  width: 175px;
}
.el-select >>> .el-input__inner {
  font-size: 16px;
}
.ar-left-align {
  float: left;
  margin-left: 10px;
  position: relative;
  top: 50%;
  -webkit-transform: translateY(-50%);
  -ms-transform: translateY(-50%);
  transform: translateY(-50%);
  line-height: 100%;
}
.ar-right-align {
  float: right;
  margin-right: 10px;
  position: relative;
  top: 50%;
  -webkit-transform: translateY(-50%);
  -ms-transform: translateY(-50%);
  transform: translateY(-50%);
  line-height: 100%;
}
.ep-button {
  color: black;
  font-weight: bold;
}
.settings-icon:hover {
  color: #DA4567;
}
.logo {
  font-family: "Courgette", cursive;
  font-weight: bold;
}
</style>

