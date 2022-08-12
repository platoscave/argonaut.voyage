<script setup lang="ts">
import {
  useHashDissect,
  updateNextLevelHash,
} from "~/composables/useHashDissect";

const props = defineProps({
  hashLevel: Number,
  menuArr: Array,
  parentKey: String,
});
const { selectedObjId, nextLevelPageId } = useHashDissect(props.hashLevel);
</script>

<template>
  <div v-for="(menuItem, subNum) in menuArr" :key="subNum">
    <!-- This menu item has it own submenu -->
    <div v-if="menuItem.menuArr">
      <ElSubMenu :index="parentKey + '-' + subNum">
        <template #title>
          <div :class="{ 'top-level-menu-item': !parentKey }">
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
        <SubMenu
          :hash-level="hashLevel"
          :menu-arr="menuItem.menuArr"
          :parent-key="parentKey + '-' + subNum"
        ></SubMenu>
      </ElSubMenu>
    </div>
    <!-- This is a simple menu item-->
    <ElMenuItem
      v-else
      :disabled="menuItem.pageId ? false : true"
      :index="parentKey + '-' + subNum"
      @click="
        () => updateNextLevelHash(hashLevel, menuItem._id ? menuItem._id : selectedObjId, menuItem.pageId)
      "
    >
      <div :class="{ 'top-level-menu-item': !parentKey }">
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
  </div>
</template>

<style scoped>
/* --el-menu-item-height */
.icon {
  margin-right: 5px;
  vertical-align: baseline;
}
.top-level-menu-item {
  font-size: larger;
  font-weight: bolder;
  vertical-align: middle;
  white-space: nowrap;
}
</style>
