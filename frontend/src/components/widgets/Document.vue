<script setup lang="ts">
import { useHashDissect } from "~/composables/useHashDissect";

interface Props {
  hashLevel?: number;
}
const props = withDefaults(defineProps<Props>(), {
  hashLevel: 0,
});

const { selectedObjId } = useHashDissect(props.hashLevel);
</script>

<template>
  <Paragraph :paragraph-id="selectedObjId" :header-level="1"></Paragraph>
</template>
