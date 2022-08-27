<script setup lang="ts">
import { ref, reactive, watch, h } from "vue";
import { db } from "~/services/dexieServices";
import useLiveQuery from "~/composables/useLiveQuery";
import {
  useHashDissect,
  updateHashWithSelectedTab,
} from "~/composables/useHashDissect";

interface Props {
  hashLevel?: number
}
const props = withDefaults(defineProps<Props>(), {
  hashLevel: 0,
})

const { selectedObjId } = useHashDissect(props.hashLevel);

</script>

<template>
  <Paragraph
    :paragraph-id="selectedObjId"
    :header-level="1"
  ></Paragraph>
</template>

<style scoped></style>
