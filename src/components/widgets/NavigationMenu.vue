<script setup lang="ts">
import { computed } from "vue";
import { db } from "~/services/dexieServices";
import useLiveQuery from "~/composables/useLiveQuery";
import {
  useHashDissect,
  updateNextLevelHash,
} from "~/composables/useHashDissect";
import toolbarSymbols from "~/assets/toolbar-symbols.svg";

const props = defineProps({
  hashLevel: Number,
  widgetObj: Object,
});

const { selectedObjId, nextLevelPageId } = useHashDissect(props.hashLevel);

interface IMenuArr {
  [key: number]: object;
}

interface IMenu {
  _id: string;
  name: string;
  menuArr: IMenuArr;
}

const menuObj = useLiveQuery<IMenu>(
  () => db.state.get(props.widgetObj.menuId),
  []
);
const accountObj = useLiveQuery<IMenu>(
  () => db.state.get(selectedObjId.value),
  [selectedObjId]
);

const onSelect = (indexStr: string) => {
  // Get the Menu Arr Item based on indexStr
  const indexArr = indexStr.split("-");
  const getMenuItem = (indexLevel: number, menuItem) => {
    const indexNum = indexArr[indexLevel];
    const subMenuItem = menuItem.menuArr[indexNum];
    if (indexLevel === indexArr.length - 1) return subMenuItem;
    return getMenuItem(indexLevel + 1, subMenuItem);
  };
  const menuItemObj = getMenuItem(0, menuObj.value);

  const nextLevelSelectedObjId = menuItemObj.nextLevelSelectedObjId
    ? menuItemObj.nextLevelSelectedObjId
    : selectedObjId;

  updateNextLevelHash(
    props.hashLevel,
    nextLevelSelectedObjId.value,
    menuItemObj.pageId
  );
};

const defaultActive = computed(() => {
  const findIndexPathForPageId = (menuArr, index) => {
    for (let idx in menuArr) {
      let item = menuArr[idx];
      if (item.pageId === nextLevelPageId.value)
        return index ? index + "-" + idx : idx;
      if (item.menuArr) {
        let result = findIndexPathForPageId(
          item.menuArr,
          index ? index + "-" + idx : idx
        );
        if (result) return result;
      }
    }
  };

  return findIndexPathForPageId(menuObj.value.menuArr, "");
});
</script>

<template>
  <div
    v-if="menuObj && menuObj.menuArr"
    class="ar-full-height ar-overflow-auto"
  >
    <div class="ar-lightgrey-background ar-title" v-if="accountObj">
      <img class="icon" :src="accountObj.icon" />
      <span>{{ accountObj.name }}</span>
    </div>
    <ElMenu unique-opened :default-active="defaultActive" @select="onSelect">
      <!-- Level 1 --->
      <div v-for="(subMenu1, subNum1) in menuObj.menuArr" :key="subNum1">
        <div v-if="subMenu1.menuArr">
          <ElSubMenu :index="subNum1.toString()">
            <template #title>
            <div class="top-level-menu-item">
              <svg class="icon" height="18" width="18" color="blue">
                <use
                  xmlns:xlink="http://www.w3.org/1999/xlink"
                  :xlink:href="'toolbar-symbols.svg#home-filled'"
                ></use>
              </svg>
              <span>{{ subMenu1.name }}</span>
              </div>
            </template>

            <!-- Level 2 --->
            <div v-for="(subMenu2, subNum2) in subMenu1.menuArr" :key="subNum2">
              <div v-if="subMenu2.menuArr">
                <ElSubMenu :index="subNum1 + '-' + subNum2">
                  <template #title>{{ subMenu2.name }}</template>

                  <!-- Level 3 --->
                  <div
                    v-for="(subMenu3, subNum3) in subMenu2.menuArr"
                    :key="subNum3"
                  >
                    <div v-if="subMenu3.menuArr">
                      <ElSubMenu
                        :index="subNum1 + '-' + subNum2 + '-' + subNum3"
                      >
                        <template #title>{{ subMenu3.name }}</template>
                      </ElSubMenu>
                    </div>
                    <ElMenuItem
                      v-else
                      :disable="subMenu3.pageId ? false : true"
                      :index="subNum1 + '-' + subNum2 + '-' + subNum3"
                      >{{ subMenu3.name }}</ElMenuItem
                    >
                  </div>
                  <!-- Level 3 --->
                </ElSubMenu>
              </div>
              <ElMenuItem
                v-else
                :disable="subMenu2.pageId ? false : true"
                :index="subNum1 + '-' + subNum2"
                >{{ subMenu2.name }}</ElMenuItem
              >
            </div>
            <!-- Level 2 --->
          </ElSubMenu>
        </div>
        <ElMenuItem
          v-else
          :disable="subMenu1.pageId ? false : true"
          :index="subNum1.toString()"
        >
          <template #title>
            <div class="top-level-menu-item">
              <svg class="icon" height="18" width="18" color="blue">
                <use
                  xmlns:xlink="http://www.w3.org/1999/xlink"
                  :xlink:href="'toolbar-symbols.svg#home-filled'"
                ></use>
              </svg>
              <span>{{ subMenu1.name }}</span>
            </div>
          </template>
        </ElMenuItem>
        <!-- Level 1 --->
      </div>
    </ElMenu>
  </div>
</template>
<style scoped>
/* --el-menu-item-height */
.icon {
  margin-right: 5px;
  vertical-align: middle;
}
.ar-title {
  padding-top: 20px;
  padding-bottom: 20px;
  font-size: larger;
  font-weight: bolder;
  vertical-align: middle;
  white-space: nowrap;
}
.top-level-menu-item {
  font-size: larger;
  font-weight: bolder;
  vertical-align: middle;
  white-space: nowrap;
}
</style>
