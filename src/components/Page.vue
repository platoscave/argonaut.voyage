<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { db } from "~/services/dexieServices";
import useLiveQuery from "~/composables/useLiveQuery";
import {
  useHashDissect,
  updateHashWithSelectedTab,
  updateNextLevelHash,
} from "../composables/useHashDissect";
import { usePageSettings, saveTabNum } from "~/composables/usePageSettings";

// https://stackoverflow.com/questions/71627355/dynamic-components-doesnt-work-in-script-setup
import BalanceSheet from "~/components/widgets/fanancialStatements/BalanceSheet.vue";
import Calendar from "~/components/widgets/Calendar.vue";
import CashFlows from "~/components/widgets/fanancialStatements/CashFlows.vue";
import ClassModel from "~/components/widgets/3dModels/ClassModel.vue";
import Document from "~/components/widgets/Document.vue";
import IncomeStatement from "~/components/widgets/fanancialStatements/IncomeStatement.vue";
import ClassSchemaForm from "~/components/widgets/ClassSchemaForm.vue";
import NavigationMenu from "~/components/widgets/NavigationMenu.vue";
import ProcessModel from "~/components/widgets/3dModels/ProcessModel.vue";
import Raw from "~/components/widgets/simpleJson/Raw.vue";
import SchemaForm from "~/components/widgets/SchemaForm.vue";
import SchemaTable from "~/components/widgets/SchemaTable.vue";
import Tree from "~/components/widgets/Tree.vue";
import Validate from "~/components/widgets/simpleJson/Validate.vue";

const props = defineProps({
  hashLevel: Number,
});

const { selectedObjId, pageId, selectedTab } = useHashDissect(props.hashLevel);
const { settingsTabNum, settingsNextLevelSelectedObjId } = usePageSettings(pageId.value);

interface IPage {
  _id: string;
  name: string;
  divider: string;
  tabs: {
    [key: number]: number;
    name: string;
    pageId: string;
    widgets: {
      [key: number]: number;
      name: string;
      displayType: string;
    }[];
  }[];
}
const pageObj = useLiveQuery<IPage>(() => db.state.get(pageId.value), [pageId]);

const dynamicComp = [
  { name: "Balance Sheet", comp: BalanceSheet },
  { name: "Class Model", comp: ClassModel },
  { name: "Calendar", comp: Calendar },
  { name: "Cash Flows", comp: CashFlows },
  { name: "Document", comp: Document },
  { name: "Income Statement", comp: IncomeStatement },
  { name: "Class Schema Form", comp: ClassSchemaForm },
  { name: "Navigation Menu", comp: NavigationMenu },
  { name: "Process Model", comp: ProcessModel },
  { name: "Raw", comp: Raw },
  { name: "Schema Form", comp: SchemaForm },
  { name: "Schema Table", comp: SchemaTable },
  { name: "Tree", comp: Tree },
  { name: "Validate", comp: Validate },
];
const getComponent = (widgetName: string = "") => {
  const nameComp = dynamicComp.find((item) => item.name === widgetName);
  if (!nameComp) console.error(`widgetName not declared: ${widgetName}`);
  return nameComp.comp;
};

const onTabChange = (evt) => {
  console.log("evt", evt);
  console.log("evt", pageObj.value.tabs[parseInt(evt)].pageId);

  updateHashWithSelectedTab(props.hashLevel, evt);
  const nextlevelPageId = pageObj.value.tabs[parseInt(evt)].pageId;
  updateNextLevelHash(props.hashLevel, selectedObjId.value, nextlevelPageId);
};
</script>

<template>
  <!-- With tabbar -->
  <div v-if="pageObj">
    <!-- {{ pageObj.tabs.length }} -->
    <div v-if="pageObj.tabs.length > 1" class="ar-full-height">
      <el-tabs :value="selectedTab ? selectedTab : '0'" @tab-change="onTabChange">
        <el-tab-pane
          class="ar-full-height"
          v-for="(tab, tabNum) in pageObj.tabs"
          :key="tabNum.toString()"
          :label="tab.name"
          :name="tabNum.toString()"
        >
          <!-- This tab has widgets -->
          <div
            v-if="tab.widgets"
            class="ar-full-height ar-full-page"
            v-for="(widget, widNum) in tab.widgets"
            :key="widNum"
          >
            <!-- Create a widget depending on display type -->
            <!-- If there is only one widget, then give it the full height -->
            <!-- Remove the spaces from displayType to get widgetName -->
            <component
              :is="getComponent(widget.displayType)"
              :class="{ 'ar-full-height': pageObj.tabs[0].widgets.length }"
              :hash-level="hashLevel"
              :widget-obj="widget"
            >
            </component>
          </div>
          <!-- This tab has a sub-page -->
          <div class="ar-full-height" v-if="tab.pageId">
            <Layout class="ar-full-height" :hash-level="hashLevel + 1"></Layout>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- No tabbar -->
    <div class="ar-full-height" v-else-if="pageObj.tabs.length === 1">
      <!-- This tab has widgets -->
      <div class="ar-full-height ar-full-page" v-if="pageObj.tabs[0].widgets">
        <div
          class="ar-full-height"
          v-for="(widget, widNum) in pageObj.tabs[0].widgets"
          :key="widNum"
        >
          <!-- Create a widget depending on display type -->
          <!-- If there is only onle widget, then give it the full height -->
          <!-- Remove the spaces from displayType to get widgetName -->
          <component
            :is="getComponent(widget.displayType)"
            :class="{ 'ar-full-height': pageObj.tabs[0].widgets.length }"
            :hash-level="hashLevel"
            :widget-obj="widget"
          >
          </component>
        </div>
      </div>

      <!-- This tab has a sub-page -->
      <div class="ar-full-height" v-if="pageObj.tabs[0].pageId">
        <Layout class="ar-full-height" :hash-level="hashLevel + 1"></Layout>
      </div>
    </div>
  </div>
</template>
<style scoped>
.el-tabs {
  height: 100%;
}
.el-tab-pane {
  height: 100%;
}
.ar-layout {
  height: 100%;
}
.el-tabs >>> .el-tabs__header {
  margin-left: 10px;
  margin-right: 10px;
  margin-bottom: 0px;
}
.el-tabs >>> .el-tabs__content {
  height: calc(100% - 40px);
  padding: 0px;
  overflow: auto;
  display: block;
  width: 100%;
}
</style>
