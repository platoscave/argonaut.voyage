<script
    setup
    lang="ts"
>
import { ref, watch } from "vue";
import { db } from "~/services/dexieServices";
import apolloServices from "~/services/apolloServices";
import useArgoQuery from "~/composables/useArgoQuery";
import { ElMessage } from "element-plus";
import { toggleDark } from "~/composables";
import jp from "jsonpath";
import { ifError } from "assert";
import PsibaseApiService from "~/services/psibaseServices";
import { liveQuery } from "dexie";


const props = defineProps(["modelValue"]);
let isDark = ref(true);

const reloadFromStatic = async () => {
    try {
        await db.reloadFromStatic()
        location.reload();
        ElMessage.success("Static File Loaded and Imported");
    } catch (err) {
        ElMessage({
            showClose: true,
            message: err.message,
            type: "error",
            duration: 5000,
        });
        console.error(err);
    }
};

const staticToPsibase = () => {
    let res = PsibaseApiService.staticToPsibase();
};

const psibaseToCache = () => {
    let res = apolloServices.psibaseToCache();
};
const testApollo = () => {
    let res = apolloServices.testApollo();
};

const saveToStatic = async () => {
    const fullData = await db.table('state').toArray();
    // const ts = Math.floor(Date.now() / 1000)

    const jsonString = JSON.stringify(fullData, null, 2);
    const csv_mime_type = "text/json";
    const blob = new Blob([jsonString], { type: csv_mime_type });
    const anchor = document.createElement("a");
    anchor.setAttribute("download", "argonautdb.json");
    const url = URL.createObjectURL(blob);
    anchor.setAttribute("href", url);
    anchor.click();
    URL.revokeObjectURL(url);
    document.removeChild(anchor);
}

const addTestAccounts = async () => {
    //PsibaseApiService.addTestAccounts(this.$message);
};



const cacheToPsibase = async () => {
    //PsibaseApiService.cacheToPsibase(this.$message);
};

const eraseAllPsibase = async () => {
    try {
        ElMessage.success("Psibase documents table erased");
    } catch (err) {
        ElMessage({
            showClose: true,
            message: err.message,
            type: "error",
            duration: 5000,
        });
        console.error(err);
    }
};

const testPsibase = async () => {
    try {
        ElMessage.success("Test function called");
    } catch (err) {
        ElMessage({
            showClose: true,
            message: err.message,
            type: "error",
            duration: 5000,
        });
        console.error(err);
    }
};

const onReadFilterDownLoad = async () => {
    const response1 = await fetch("data/argonautdbNewKeys.json");
    const argonautdbNewKeys = await response1.json();
    // const response2 = await fetch("data/newClassKeys.json");
    // const newClassKeys = await response2.json();
    // const response3 = await fetch("argonautdb.json");
    // const argonautdb = await response3.text();
    const newDb = []

    // oldClassKeys.forEach((item, idx) => {
    //   item.newKey = newClassKeys[idx]
    // })
    //let newText = argonautdb.toString()
    argonautdbNewKeys.forEach((item, idx) => {
        if (item.classId) {
            newDb.push(item)
        }
    })

    const jsonString = JSON.stringify(newDb, null, 2);
    const csv_mime_type = "text/json";
    const blob = new Blob([jsonString], { type: csv_mime_type });
    const anchor = document.createElement("a");
    anchor.setAttribute("download", "objects.json");
    const url = URL.createObjectURL(blob);
    anchor.setAttribute("href", url);
    anchor.click();
    URL.revokeObjectURL(url);

    /*
    var svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    var svgUrl = URL.createObjectURL(svgBlob);
    var downloadLink = document.createElement("a");
    downloadLink.href = svgUrl;
    downloadLink.download = iconName + ".svg";
    document.body.appendChild(downloadLink);
    //downloadLink.click();
    document.body.removeChild(downloadLink);
    */
};

const randomKey = async () => {
    const characters = "abcdefghijklmnopqrstuvwxyz12345";
    let randomKey = "";
    for (let i = 0; i < 12; i++) {
        randomKey += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    alert(randomKey);
};

const testQuery = async () => {
    const query = {
        "key": "tllcmvjazmz2",
        "name": "Root Class Query",
        "classId": "q234ooehrk5v",
        "ownerId": "argonautvoya",
        "selector": "Where Clause",
        // "subQueryIds": [
        //   "2jfs4is4icct",
        //   "x1lrv2xdq2tu"
        // ],
        "where": {
            "key": "gzthjuyjca4s"
        }
    }
    try {
        const resultsRef = useArgoQuery(query, null,  isDark);

        watch(resultsRef, (resultsRef) => console.log("resultsRef", resultsRef));
    } catch (err) {
        ElMessage({
            showClose: true,
            message: err.message,
            type: "error",
            duration: 5000,
        });
        console.error(err);
    }
    /*

    try {
        const observable$ = liveQuery(
            () => db.state
                .where({
                    "key": "gzthjuyjca4s"
                })
                .toArray()
        );

        // Subscribe
        const subscription = observable$.subscribe({
            next: result => console.log("Got result:", result),
            error: error => console.error(error)
        });

        // Unsubscribe
        //subscription.unsubscribe();

        //watch(resultsRef, (resultsRef) => console.log("resultsRef", resultsRef));
    } catch (err) {
        ElMessage({
            showClose: true,
            message: err.message,
            type: "error",
            duration: 5000,
        });
        console.error(err);
    }
    */
};

</script>

<template>
    <ElDialog
        title="Settings"
        :model-value="modelValue"
        @update:modelValue="() => $emit('update:modelValue', false)"
    >
        <ElRow>
            <ElSwitch
                size="small"
                class="ar-left-align"
                v-model="isDark"
                @click="toggleDark()"
                active-text="Dark"
                inactive-text="Light"
            ></ElSwitch>
        </ElRow>

        <ElRow>
            <ElButton
                type="primary"
                :dark="isDark"
                plain
                @click="reloadFromStatic"
            >
                Poputate Cache From Static
            </ElButton>
        </ElRow>

        <ElRow>
            <ElButton
                type="primary"
                :dark="isDark"
                plain
                @click="saveToStatic"
            >
                Save to Static
            </ElButton>
        </ElRow>

        <ElRow>
            <ElButton
                type="primary"
                :dark="isDark"
                plain
                @click="addTestAccounts"
            >
                Add Tests Accounts to Psibase
            </ElButton>
        </ElRow>
        <p></p>

        <ElRow>
            <ElButton
                type="primary"
                :dark="isDark"
                plain
                @click="staticToPsibase"
            >
                From Static to Psibase
            </ElButton>
        </ElRow>

        <ElRow>
            <ElButton
                type="primary"
                :dark="isDark"
                plain
                @click="psibaseToCache"
            >
                From Psibase to Cache
            </ElButton>
        </ElRow>


        <ElRow>
            <ElButton
                type="primary"
                :dark="isDark"
                plain
                @click="testApollo"
            >
                Test Apollo
            </ElButton>
        </ElRow>

        <ElRow>
            <ElButton
                type="primary"
                :dark="isDark"
                plain
                @click="cacheToPsibase"
            >
                From Cache to Psibase
            </ElButton>
        </ElRow>

        <ElRow>
            <ElButton
                type="primary"
                :dark="isDark"
                plain
                @click="eraseAllPsibase"
            >
                Erase Documents Table in Psibase
            </ElButton>
        </ElRow>

        <ElRow>
            <ElButton
                type="primary"
                :dark="isDark"
                plain
                @click="testPsibase"
            >Call Test Function</ElButton>
        </ElRow>

        <ElRow>
            <ElButton
                type="primary"
                :dark="isDark"
                plain
                @click="onReadFilterDownLoad"
            >
                Read, Filter, Download
            </ElButton>
        </ElRow>

        <ElRow>
            <ElButton
                type="primary"
                :dark="isDark"
                plain
                @click="randomKey"
            >Random Key</ElButton>
        </ElRow>

        <ElRow>
            <ElButton
                type="primary"
                :dark="isDark"
                plain
                @click="testQuery"
            >Test Query</ElButton>
        </ElRow>

    </ElDialog>
</template>

<style scoped>
.el-row {
    margin-top: 10px;
}
</style>
