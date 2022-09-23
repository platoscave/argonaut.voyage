<script setup lang="ts">
import { computed } from "vue";
import { db } from "~/services/dexieServices";
import useLiveQuery from "~/composables/useLiveQuery";
import { useHashDissect } from "~/composables/useHashDissect";
import NavigationItem1 from "./NavigationItem.vue";

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

const menuObj = useLiveQuery<IMenu>(() => db.state.get(props.widgetObj.menuId), []);
const accountObj = useLiveQuery<IMenu>(() => db.state.get(selectedObjId.value), [
  selectedObjId,
]);

const defaultActive = computed(() => {
  const findIndexPathForPageId = (menuArr, index) => {
    for (let idx in menuArr) {
      let item = menuArr[idx];
      if (item.pageId === nextLevelPageId.value) return index + "-" + idx;
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
  <div v-if="menuObj && menuObj.menuArr" class="ar-full-height ar-overflow-auto">
    <div class="ar-lightgrey-background ar-title" v-if="accountObj">
      <img class="icon" :src="'icons/'+accountObj.icon" />
      <span>{{ accountObj.name }}</span>
    </div>
    <ElMenu unique-opened :default-active="defaultActive">
      <div v-for="(menuItem, subNum) in menuObj.menuArr" :key="subNum">
        <NavigationItem
          :hash-level="hashLevel"
          :menu-item="menuItem"
          :index="subNum.toString()"
          :top-level="true"
        ></NavigationItem>
      </div>
    </ElMenu>
  </div>
</template>
<style scoped>
/* --el-menu-item-height */
.icon {
  margin-right: 5px;
  vertical-align: middle;
  height: 40px;
  width: 40px;
}
.ar-title {
  padding-top: 20px;
  padding-bottom: 20px;
  font-size: larger;
  font-weight: bolder;
  vertical-align: middle;
  white-space: nowrap;
}
</style>
