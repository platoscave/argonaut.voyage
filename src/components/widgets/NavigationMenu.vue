<script setup lang="ts">
import { computed } from "vue";
import { db } from "../../services/dexieServices";
import useLiveQuery from "../../lib/useLiveQuery";
import {
  useHashDissect,
  updateNextLevelHash,
} from "../../composables/useHashDissect";

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
  const findIndexPathForPageId = (pageId, menuArr, index) => {
    for (let idx in menuArr) {
      let item = menuArr[idx];
      if (item.pageId === pageId) return index + "-" + idx;
      if (item.menuArr) {
        let result = findIndexPathForPageId(
          pageId,
          item.menuArr,
          index + "-" + idx
        );
        if (result) return result;
      }
    }
  };

  return findIndexPathForPageId(nextLevelPageId.value, menuObj.value.menuArr, "");
});
</script>

<template>
  <h3 v-if="accountObj">{{ accountObj.name }}</h3>
  <div v-if="menuObj && menuObj.menuArr">
    <el-menu
      unique-opened
      default-active="defaultActive"
      class="el-menu-vertical-demo"
      @select="onSelect"
    >
      <!-- Level 1 --->
      <div v-for="(subMenu1, subNum1) in menuObj.menuArr" :key="subNum1">
        <div v-if="subMenu1.menuArr">
          <el-sub-menu :index="subNum1.toString()">
            <template #title>{{ subMenu1.name }}</template>

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
        <el-menu-item v-else :index="subNum1.toString()">{{
          subMenu1.name
        }}</el-menu-item>
        <!-- Level 1 --->
      </div>
    </el-menu>
  </div>
</template>
