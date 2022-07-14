<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { db } from "../services/dexieServices";
import useLiveQuery from "../lib/useLiveQuery";
import { useHashDissect, updateHashWithSelectedTab } from "../composables/useHashDissect";

// import BalanceSheet from "./widgets/BalanceSheet.vue";
// import Calendar from "./widgets/Calendar.vue";
// import CashFlows from "./widgets/CashFlows.vue";
// import ClassModel from "./widgets/ClassModel.vue";
// import Document from "./widgets/Document.vue";
// import IncomeStatement from "./widgets/IncomeStatement.vue";
// import MaterializedView from "./widgets/simpleJson/MaterializedView.vue";
// import MergedAncestorsForm from "./widgets/MergedAncestorsForm.vue";
import NavigationMenu from "./widgets/NavigationMenu.vue";
// import PageEditor from "./widgets/PageEditor.vue";
// import ProcessModel from "./widgets/ProcessModel.vue";
// import Raw from "./widgets/simpleJson/Raw.vue";
// import Tiptap from "./widgets/Tiptap.vue";
// import Tree from "./widgets/Tree.vue";
// import Validate from "./widgets/simpleJson/Validate.vue";
// import ViewForm from "./widgets/ViewForm.vue";
// import ViewTable from "./widgets/ViewTable.vue";

const props = defineProps({
  hashLevel: Number,
})

const {pageId, selectedTab} = useHashDissect(props.hashLevel);

interface ITabs {
    [key:number]:object
}

interface IPage {
  _id: string;
  name: string;
  divider: string;
  tabs: ITabs;
}

const pageObj = useLiveQuery<IPage>(
  () => db.state.get(pageId.value),
  [pageId]
);

</script>




<template>
  <!-- With tabbar -->
  <div v-if="pageObj">
  <div v-if="pageObj.tabs.length > 1">
    <el-tabs
      :value="selectedTab ? selectedTab : '0'"
      @tab-click="updateHashWithSelectedTab(hashLevel, '2')"
    >
      <el-tab-pane
        v-for="(tab, tabNum) in pageObj.tabs"
        :key="tabNum.toString()"
        :label="tab.name"
        :name="tabNum.toString()"
      >
        <!-- This tab has widgets -->
        <div class="ar-full-height" v-if="tab.widgets">
          <div class="ar-full-height"  v-for="(widget, widNum) in tab.widgets" :key="widNum">
          
          <!-- Create a widget depending on display type -->
          <!-- If there is only onle widget, then give it the full height -->
          <!-- Remove the spaces from displayType to get widgetName -->
          <component
            :is="(widget.displayType.split(' ').join(''))"
            :class="{'ar-full-height': pageObj.tabs[0].widgets.length}"
            :display-type="widget.displayType"
            :hash-level="hashLevel"
            :view-id="widget.viewId"
            :menu-id="widget.menuId"
            :widget-name="widget.name">
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
      <div class="ar-full-height"  v-for="(widget, widNum) in pageObj.tabs[0].widgets" :key="widNum">
        
        <!-- Create a widget depending on display type -->
        <!-- If there is only onle widget, then give it the full height -->
        <!-- Remove the spaces from displayType to get widgetName -->
        <component
          :is="NavigationMenu"
          :class="{'ar-full-height': pageObj.tabs[0].widgets.length}"
          :hash-level="hashLevel"
          :widget-obj="widget">
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

