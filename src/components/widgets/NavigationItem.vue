<script setup lang="ts">
import { reactive, watch } from "vue";
import useArgoQuery from "~/composables/useArgoQuery";
import {
  useHashDissect,
  updateNextLevelHash,
} from "~/composables/useHashDissect";

const props = defineProps({
  hashLevel: Number,
  menuItem: Object,
  index: String,
  topLevel: Boolean
});
const { selectedObjId, nextLevelPageId } = useHashDissect(props.hashLevel);
let teams = reactive([{name: 'one'}])

if(props.menuItem.argoQuery) {
  const localTeams = useArgoQuery(
    { extendTo: "Owned Accounts" },
    {
      _id: selectedObjId.value,
    },
    [selectedObjId]
  );
  watch(localTeams, (localTeams) => {
    console.log('localTeams', localTeams)
    teams.length = 0
    localTeams.forEach( item => {
      teams.push({
        _id: item._id,
        name: item.name,
        pageId: "4q5nx5ek5gww",

      })
    })
  })

}
</script>

<template>
  <!-- This menu item has it own submenu -->
  <div v-if="menuItem.menuArr || menuItem.argoQuery">
    <ElSubMenu :index="index">
      <template #title>
        <div :class="{ 'top-level-menu-item': topLevel }">
          <!-- <img  v-if="menuItem.icon" class="icon" :src="menuItem.icon" /> -->
          <svg
            v-if="menuItem.icon"
            class="icon"
            height="20"
            width="20"
            color="blue"
          >
            <use
              xmlns:xlink="http://www.w3.org/1999/xlink"
              :xlink:href="'toolbar-symbols.svg#' + menuItem.icon"
            ></use>
          </svg>
          <span>{{ menuItem.name }}</span>
        </div>
      </template>
      <div v-if="menuItem.menuArr" v-for="(subMenuItem, subIndex) in menuItem.menuArr" :key="subIndex">
        <NavigationItem
          :hash-level="hashLevel"
          :menu-item="subMenuItem"
          :index="index + '-' + subIndex"
        ></NavigationItem>
      </div>
      <div v-if="menuItem.argoQuery" v-for="(subMenuItem, subIndex) in teams" :key="subIndex">
        <NavigationItem
          :hash-level="hashLevel"
          :menu-item="subMenuItem"
          :index="index + '-' + subIndex"
        ></NavigationItem>
      </div>
      <!-- <SubMenu
          :hash-level="hashLevel"
          :menu-arr="menuItem.menuArr"
          :parent-key="parentKey + '-' + subNum"
        ></SubMenu> -->
    </ElSubMenu>
  </div>
  <!-- This is a simple menu item-->
  <ElMenuItem
    v-else
    :disabled="menuItem.pageId ? false : true"
    :index="index"
    @click="
      () =>
        updateNextLevelHash(
          hashLevel,
          menuItem._id ? menuItem._id : selectedObjId,
          menuItem.pageId
        )
    "
  >
    <div :class="{ 'top-level-menu-item': topLevel }">
      <!-- <img  v-if="menuItem.icon" class="icon" :src="menuItem.icon" /> -->
      <svg
        v-if="menuItem.icon"
        class="icon"
        height="20"
        width="20"
        color="blue"
      >
        <use
          xmlns:xlink="http://www.w3.org/1999/xlink"
          :xlink:href="'toolbar-symbols.svg#' + menuItem.icon"
        ></use>
      </svg>
      <span>{{ menuItem.name }}</span>
    </div>
  </ElMenuItem>
</template>

<style scoped>
/* --el-menu-item-height */
.icon {
  margin-right: 5px;
  vertical-align: middle;
}
.top-level-menu-item {
  font-size: larger;
  font-weight: bolder;
  vertical-align: middle;
  white-space: nowrap;
}
</style>
