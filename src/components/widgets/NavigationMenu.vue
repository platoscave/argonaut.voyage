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
      {{ accountObj.name }}
    </div>
    <el-menu unique-opened :default-active="defaultActive" @select="onSelect">
      <!-- Level 1 --->
      <div v-for="(subMenu1, subNum1) in menuObj.menuArr" :key="subNum1">
        <div v-if="subMenu1.menuArr">
          <el-sub-menu :index="subNum1.toString()">
            <template #title>
              <svg height="20" width="20" color="blue">
                <use
                  xmlns:xlink="http://www.w3.org/1999/xlink"
                  :xlink:href="'toolbar-symbols.svg#home-filled'"
                ></use>
              </svg>
              <span class="top-level-menu-item">{{ subMenu1.name }}</span>
            </template>

            <!-- Level 2 --->
            <div v-for="(subMenu2, subNum2) in subMenu1.menuArr" :key="subNum2">
              <div v-if="subMenu2.menuArr">
                <el-sub-menu :index="subNum1 + '-' + subNum2">
                  <template #title>{{ subMenu2.name }}</template>

                  <!-- Level 3 --->
                  <div
                    v-for="(subMenu3, subNum3) in subMenu2.menuArr"
                    :key="subNum3"
                  >
                    <div v-if="subMenu3.menuArr">
                      <el-sub-menu
                        :index="subNum1 + '-' + subNum2 + '-' + subNum3"
                      >
                        <template #title>{{ subMenu3.name }}</template>
                      </el-sub-menu>
                    </div>
                    <el-menu-item
                      v-else
                      :index="subNum1 + '-' + subNum2 + '-' + subNum3"
                      >{{ subMenu3.name }}</el-menu-item
                    >
                  </div>
                  <!-- Level 3 --->
                </el-sub-menu>
              </div>
              <el-menu-item v-else :index="subNum1 + '-' + subNum2">{{
                subMenu2.name
              }}</el-menu-item>
            </div>
            <!-- Level 2 --->
          </el-sub-menu>
        </div>
        <el-menu-item v-else :index="subNum1.toString()">
          <template #title>
            <svg height="20" width="20" color="blue">
              <use
                xmlns:xlink="http://www.w3.org/1999/xlink"
                :xlink:href="'toolbar-symbols.svg#home-filled'"
              ></use>
            </svg>
            <span class="top-level-menu-item">{{ subMenu1.name }}</span>
          </template>
        </el-menu-item>
        <!-- Level 1 --->
      </div>
    </el-menu>
  </div>
</template>
<style scoped>
/* Split pane */
.top-level-menu-item {
  font-weight: bolder;
  font-size: larger;
  margin-left: 5px;
}
.ar-title {
  padding-top: 20px;
  padding-bottom: 20px;
  font-size: larger;
  font-weight: bolder;
}
.el-menu-item {
  line-height: 40px;
}
.el-sub-menu {
  line-height: 40px;
}
.splitpanes--vertical > .splitpanes__splitter {
  min-width: 3px;
  background: linear-gradient(90deg, #ccc, #111);
}

.splitpanes--horizontal > .splitpanes__splitter {
  min-height: 3px;
  background: linear-gradient(0deg, #ccc, #111);
}
</style>
