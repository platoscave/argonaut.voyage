<script setup lang="ts">
import { ref, reactive, onMounted, computed, toRefs } from "vue";
import { db } from "../services/dexieServices";
import useLiveQuery from "../lib/useLiveQuery";
import { useHashDissect } from "../composables/useHashDissect";
import { Splitpanes, Pane } from "splitpanes";
import "splitpanes/dist/splitpanes.css";
//import WidgetMixin from "../lib/widgetMixin";
//import ResSplitPane from "vue-resize-split-pane";
// import Studio from "./StudioLayout";
// import ClassModel from "./widgets/ClassModel.vue";
// import ProcessModel from "./widgets/ProcessModel.vue";


const props = defineProps({
  hashLevel: Number,
})

let splitterSettings = reactive([20, 80]);

const { pageId } = useHashDissect(props.hashLevel);

interface pageRec {
  _id: string;
  name: string;
  divider: string;
  tabs: object;
}

const pageObj = useLiveQuery<pageRec>(
  () => db.state.get(pageId.value),
  [pageId]
);

const onResized = (splitterSettingsArr) => {
  console.log("splitterSettings", splitterSettingsArr);
  db.settings.update(pageId.value, {
    splitterSettings: splitterSettingsArr.map((item) => item.size),
  });
};

onMounted(async () => {
  if (pageId.value) {
    const pageSettings = await db.settings.get(pageId.value);
    if (pageSettings) {
      if (pageSettings.splitterSettings)
        splitterSettings = pageSettings.splitterSettings;
    } else await db.settings.add({ pageId: pageId.value });
  }
});
</script>

<template>
  <div v-if="pageObj">
    <!-- Single page layout -->

    <!-- <Page
      v-if="!pageObj.divider || pageObj.divider === 'None'"
      class="ar-full-height"
      v-bind:hash-level="hashLevel"
      v-bind:tabs="pageObj.tabs"
    ></Page> -->

    <!-- Divider layout -->

    <splitpanes style="height: 100%" @resized="onResized">
      <pane min-size="20" :size="splitterSettings[0]">
        <Page class="ar-full-height" v-bind:hash-level="hashLevel"></Page>
      </pane>
      <pane :size="splitterSettings[1]">5</pane>
    </splitpanes>

    <!-- <rs-panes
      v-else-if="
        pageObj.divider === 'Vertical' || pageObj.divider === 'Horizontal'
      "
      split-to="columns"
      :allow-resize="true"
      v-on:update:size="paneResizeStop"
      :size="layoutSettings.paneSize"
      :min-size="40"
      resizerColor="#2196f3"
    >

      < !-- Master content -- >

      <Page
        class="ar-full-height"
        slot="firstPane"
        v-bind:hash-level="hashLevel"
        v-bind:tabs="pageObj.tabs"
      ></Page>

      < !-- Slave content -- >

      <Layout
        class="ar-full-height right"
        slot="secondPane"
        v-bind:hash-level="hashLevel + 1"
      ></Layout>

    </rs-panes> -->

    <!-- Studio layout -->

    <!-- <StudioLayout
      class="ar-full-height"
      v-else
      v-on:leftsize="leftSizeStop"
      v-on:rightsize="rightSizeStop"
      v-bind:left-size="layoutSettings.leftSize"
      v-bind:right-size="layoutSettings.rightSize"
    >

      < !-- Background content -->

    <!-- TODO divider misuse. Come up with a better way to determin which model to dispaly 
            It's almost like we need a second pageId-- >

      <ClassModel
        v-if="pageObj.divider === 'Class Model'"
        slot="diagram"
        class="ar-full-height"
        v-bind:hash-level="hashLevel"
        v-bind:view-id="pageObj.tabs[0].widgets[0].viewId"
      ></ClassModel>

      <ProcessModel
        v-else-if="pageObj.divider === 'Process Model'"
        slot="diagram"
        class="ar-full-height"
        v-bind:hash-level="hashLevel"
        v-bind:view-id="pageObj.tabs[0].widgets[0].viewId"
      ></ProcessModel>


      < !-- Master content -- >

      <Page
        slot="drawer-left"
        class="ar-full-height"
        v-bind:hash-level="hashLevel"
        v-bind:tabs="pageObj.tabs"
      ></Page>

      < !-- Slave content -- >

      <Layout
        slot="drawer-right"
        class="ar-full-height right"
        v-bind:hash-level="hashLevel + 1"
      ></Layout>

    </StudioLayout> -->
  </div>
</template>

<!--
<script>
import { db } from "../services/dexieServices";
import { liveQuery } from "dexie";
import { pluck, switchMap, filter, distinctUntilChanged } from "rxjs/operators";
import WidgetMixin from "../lib/widgetMixin";
import ResSplitPane from "vue-resize-split-pane";
import Studio from "./StudioLayout";
import ClassModel from "./widgets/ClassModel.vue";
import ProcessModel from "./widgets/ProcessModel.vue";

export default {
  name: "ar-layout",
  mixins: [WidgetMixin],
  components: {
    "rs-panes": ResSplitPane,
    "ar-studio": Studio,
    "ar-class-model": ClassModel,
    "ar-process-model": ProcessModel,
  },
  props: {
    hashLevel: Number,
  },
  data() {
    return {
      layoutSettings: {
        paneSize: 200,
        leftSize: 300,
        rightSize: 300,
      },
      pageId: "",
    };
  },

  subscriptions() {
    //
    // Watch the pageId as observable
    const pageId$ = this.$watchAsObservable("pageId", {
      immediate: true,
    })
      .pipe(pluck("newValue")) // Obtain value from reactive var (whenever it changes)
      .pipe(filter((pageId) => pageId)) //filter out falsy values
      .pipe(distinctUntilChanged()); // emit only when changed

    // Whenever selectedObjId changes, reset the live query with the new selectedObjId
    const pageObj$ = pageId$.pipe(
      switchMap((pageId) =>
        liveQuery(() => db.state.where({ _id: pageId }).first())
      )
    );

    return {
      pageObj: pageObj$
    }
  },

  methods: {
    async paneResizeStop(paneSize) {
      this.layoutSettings.paneSize = paneSize;
      await db.settings.update(this.pageId, {
        layoutSettings: this.layoutSettings,
      });
    },
    async leftSizeStop(leftSize) {
      this.layoutSettings.leftSize = leftSize;
      await db.settings.update(this.pageId, {
        layoutSettings: this.layoutSettings,
      });
    },
    async rightSizeStop(rightSize) {
      this.layoutSettings.rightSize = rightSize;
      await db.settings.update(this.pageId, {
        layoutSettings: this.layoutSettings,
      });
    },
  },
  async mounted() {
    if (this.pageId) {
      // See if we can get a layout settings from the last time we visited this page
      const pageSettings = await db.settings.get(this.pageId);
      if (pageSettings) {
        if (pageSettings.layoutSettings)
          this.layoutSettings = pageSettings.layoutSettings;
      } else await db.settings.add({ pageId: this.pageId });
    }
  },
};
</script>

-->

<style>
/* Split pane */
.Xsplitpanes__pane {
  display: flex;
  justify-content: center;
  align-items: center;
  font-family: Helvetica, Arial, sans-serif;
  color: rgba(255, 255, 255, 0.6);
  font-size: 5em;
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
