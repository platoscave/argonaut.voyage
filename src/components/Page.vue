<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { db } from "~/services/dexieServices";
import useLiveQuery from "~/composables/useLiveQuery";
import {
  useHashDissect,
  updateHashWithSelectedTab,
} from "../composables/useHashDissect";

// https://stackoverflow.com/questions/71627355/dynamic-components-doesnt-work-in-script-setup
import BalanceSheet from "~/components/widgets/fanancialStatements/BalanceSheet.vue";
import Calendar from "~/components/widgets/Calendar.vue";
import CashFlows from "~/components/widgets/fanancialStatements/CashFlows.vue";
import ClassModel from "~/components/widgets/3dModels/ClassModel.vue";
// import Document from "~/components/widgets/Document.vue";
import IncomeStatement from "~/components/widgets/fanancialStatements/IncomeStatement.vue";
// import MaterializedView from "~/components/widgets/simpleJson/MaterializedView.vue";
import MergedAncestorsForm from "~/components/widgets/MergedAncestorsForm.vue";
import NavigationMenu from "~/components/widgets/NavigationMenu.vue";
// import PageEditor from "~/components/widgets/PageEditor.vue";
import ProcessModel from "~/components/widgets/3dModels/ProcessModel.vue";
import Raw from "~/components/widgets/simpleJson/Raw.vue";
// import Tiptap from "~/components/widgets/Tiptap.vue";
import Tree from "~/components/widgets/Tree.vue";
import Validate from "~/components/widgets/simpleJson/Validate.vue";
// import ViewForm from "~/components/widgets/ViewForm.vue";
// import ViewTable from "~/components/widgets/ViewTable.vue";

const props = defineProps({
  hashLevel: Number,
});

const { pageId, selectedTab } = useHashDissect(props.hashLevel);

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
  { name: "Income Statement", comp: IncomeStatement },
  { name: "Merged Ancestors Form", comp: MergedAncestorsForm },
  { name: "Navigation Menu", comp: NavigationMenu },
  { name: "Process Model", comp: ProcessModel },
  { name: "Raw", comp: Raw },
  { name: "Tree", comp: Tree },
  { name: "Validate", comp: Validate },
];
const getComponent = (widgetName: string = '') => {
  const nameComp = dynamicComp.find((item) => item.name === widgetName)
  if(!nameComp) console.error( `widgetName not declared: ${widgetName}`)
  return nameComp.comp
};
</script>

<template>
  <!-- With tabbar -->
  <div v-if="pageObj">
  <!-- {{ pageObj.tabs.length }} -->
    <div v-if="pageObj.tabs.length > 1"  class="ar-full-height">
      <el-tabs
        :value="selectedTab ? selectedTab : '0'"
        @tab-click="updateHashWithSelectedTab(hashLevel, '2')"
      >
        <el-tab-pane  class="ar-full-height" 
          v-for="(tab, tabNum) in pageObj.tabs"
          :key="tabNum.toString()"
          :label="tab.name"
          :name="tabNum.toString()"
        >
          <!-- This tab has widgets -->
          <div class="ar-full-height" v-if="tab.widgets">
            <div
              class="ar-full-height"
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
          </div>
          <!-- This tab has a sub-page -->
          <div class="ar-full-height" v-if="tab.pageId">
            <Layout :hash-level="hashLevel + 1"></Layout>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- No tabbar -->
    <div class="ar-full-height" v-else-if="pageObj.tabs.length === 1">
      <!-- This tab has widgets -->
      <div class="ar-full-height" v-if="pageObj.tabs[0].widgets">
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
        <Layout :hash-level="hashLevel + 1"></Layout>
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
.ar-widget-selector {
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