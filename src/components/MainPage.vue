<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { db } from "~/services/dexieServices";
//import EosServices from "~/services/eosServices";
import { liveQuery } from "dexie";
import { useSubscription } from '@vueuse/rxjs'
import { interval } from 'rxjs'
import networks from "~/config/networks.js";
import toolbarSymbols from "~/assets/toolbar-symbols.svg";
import { ElMessage } from 'element-plus'

let dialogVisible = ref(false);
let networkUserObj = reactive({});
let updatedObjectsCount = ref(true)

let users = ref({})
//let users = useSubscription( liveQuery(() => db.settings.get("application")))



const updateCurrentNetwork = async (currentNetwork) => {
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

// useSubscription call unsubscribe method before unmount the component
// useSubscription(
//   interval(1000)
//     .subscribe(() => {
//       count.value++
//       console.log(count)
//     }),
// )
useSubscription(
  liveQuery(() => db.settings.get("application")).subscribe((result) => {
    //console.log('hi')
    networkUserObj.value = result
  })
)
      // users: liveQuery(() =>
      //   db.state.where({ classId: "hdt3hmnsaghk" }).sortBy("name")
      // ),
      // updatedObjectsCount: liveQuery(() => db.updatedObjects.count()),
      // networkUserObj: liveQuery(() => db.settings.get("application")),


onMounted( async () => {
      // If argonautdb is not filled yet, populate it from the static file
    //const count = await db.state.count();
    //if (!count) await this.$refs["settingsDlg"].populateFromStatic();

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

    <!--<ar-layout class="ar-main" :hash-level="0"></ar-layout>-->
    <div class="ar-main" ></div>

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
        @input="updateCurrentNetwork"
      >

        <el-option
          v-for="network in networks"
          :key="network"
          :label="network.name"
          :value="network"
        >

        </el-option>

      </el-select>

      <el-select
        v-if="networkUserObj"
        class="ar-left-align"
        size="small"
        placeholder="Select User"
        :value="networkUserObj.currentUserId"
        @input="updateCurrentUser"
      >

        <el-option
          v-for="user in users"
          :key="user._id"
          :label="user.name"
          :value="user._id"
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

   
    <settings-dlg ref="settingsDlg" v-model="dialogVisible"> </settings-dlg>


  </div>

</template>

<style>
#app {
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
.ep-select {
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

