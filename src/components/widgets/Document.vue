<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { db } from "~/services/dexieServices";
import useLiveQuery from "~/composables/useLiveQuery";
import { useHashDissect, updateHashWithSelectedTab } from "~/composables/useHashDissect";

const props = defineProps({
  hashLevel: Number,
  viewId: String,
})

const {pageId, selectedTab} = useHashDissect(props.hashLevel)

interface IView {
  _id: string;
  name: string;
}

const viewObj = useLiveQuery<IView>(
  () => db.state.get(props.viewId),
  [props.viewId]
)

</script>

<template>
  <div>
  </div>
</template>

<style scoped>
</style>
