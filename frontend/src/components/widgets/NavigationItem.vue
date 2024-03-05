<script setup lang="ts">
import { reactive, watch } from "vue";
import useArgoQuery from "~/composables/useArgoQuery";
import { useHashDissect, updateNextLevelHash } from "~/composables/useHashDissect";

const props = defineProps({
  hashLevel: Number,
  menuItem: Object,
  index: String,
  topLevel: Boolean,
});
const { selectedObjId, nextLevelPageId } = useHashDissect(props.hashLevel);
let teams = reactive([{ name: "one" }]);

if (props.menuItem.argoQuery) {
  const localTeams = useArgoQuery(
    {
      selector: "Owned Accounts",
      where: { key: "$fk" },
      nodesPageId: "dot1cmmhp2ve",
    },
    {
      key: selectedObjId.value,
    },
    [selectedObjId]
  );
  watch(localTeams, (localTeams) => {
    //console.log('localTeams', localTeams)
    teams.length = 0;
    localTeams.forEach((item) => {
      teams.push({
        key: item.key,
        name: item.name,
        pageId: item.treeVars.nodesPageId,
      });
    });
  });
}
</script>

<template>
  <!-- This menu item has it own submenu -->
  <div v-if="menuItem.menuArr || menuItem.argoQuery">
    <ElSubMenu :index="index">
      <template #title>
        <div :class="{ 'top-level-menu-item': topLevel }">
          <img v-if="menuItem.icon" class="icon" :src="'icons/' + menuItem.icon" />
          <span>{{ menuItem.name }}</span>
        </div>
      </template>
      <div v-if="menuItem.menuArr" v-for="(subMenuItem, subIndex) in menuItem.menuArr" :key="subIndex">
        <NavigationItem :hash-level="hashLevel" :menu-item="subMenuItem" :index="index + '-' + subIndex"></NavigationItem>
      </div>
      <div v-if="menuItem.argoQuery" v-for="(subMenuItem, subIndex) in teams" :key="subIndex">
        <NavigationItem :hash-level="hashLevel" :menu-item="subMenuItem" :index="index + '-' + subIndex"></NavigationItem>
      </div>
    </ElSubMenu>
  </div>
  <!-- This is a simple menu item-->
  <ElMenuItem v-else :disabled="menuItem.pageId ? false : true" :index="index" @click="() =>
      updateNextLevelHash(
        hashLevel,
        menuItem.key ? menuItem.key : selectedObjId,
        menuItem.pageId
      )
    ">
    <div :class="{ 'top-level-menu-item': topLevel }">
      <img v-if="menuItem.icon" class="icon" :src="'icons/' + menuItem.icon" />
      <!-- <svg v-if="menuItem.icon" class="icon" height="20" width="20" color="blue">
        <use
          xmlns:xlink="http://www.w3.org/1999/xlink"
          :xlink:href="'toolbar-symbols.svg#' + menuItem.icon"
        ></use>
      </svg> -->
      <span>{{ menuItem.name }}</span>
    </div>
  </ElMenuItem>
</template>

<style scoped>
/* --el-menu-item-height */
.icon {
  margin-right: 10px;
  vertical-align: middle;
  height: 24px;
  width: 24px;
}

.top-level-menu-item {
  font-size: larger;
  font-weight: bolder;
  vertical-align: middle;
  white-space: nowrap;
}
</style>
