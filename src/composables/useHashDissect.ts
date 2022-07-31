// mouse.js
import { ref, reactive, toRefs, onMounted, onUnmounted } from 'vue'
import { db } from "~/services/dexieServices";

interface ILevelState {
  selectedObjId: string,
  pageId: string,
  selectedTab: string,
  nextLevelSelectedObjId: string,
  nextLevelPageId: string,
}
// by convention, composable function names start with "use"
export function useHashDissect(hashLevel: number = 0) {
  // state encapsulated and managed by the composable
  const levelState: ILevelState = reactive({
    selectedObjId: '',
    pageId: '',
    selectedTab: '',
    nextLevelSelectedObjId: '',
    nextLevelPageId: ''
  })

  const handleHashChange = () => {

    const hashArr = window.location.hash.split("/")

    const ourLevelStr = hashArr[hashLevel + 1];
    if (ourLevelStr) {
      const ourLevelArr = ourLevelStr.split(".")
      levelState.selectedObjId = ourLevelArr[0]
      levelState.pageId = ourLevelArr[1]
      levelState.selectedTab = ourLevelArr[2]
    }

    const nextLevelStr = hashArr[hashLevel + 2];
    if (nextLevelStr) {
      const nextLevelArr = nextLevelStr.split(".")
      levelState.nextLevelSelectedObjId = nextLevelArr[0]
      levelState.nextLevelPageId = nextLevelArr[1]
    }

    //console.log('handleHashChange', this.hashLevel, this.nextLevelSelectedObjId)
  }

  handleHashChange()
  onMounted(() => window.addEventListener('hashchange', handleHashChange))
  onUnmounted(() => window.removeEventListener('hashchange', handleHashChange))

  // expose managed state as return value
  return {
    ...toRefs(levelState)
  };
}



// This method can be called when a user selects a tree node, a table row, or a menu item
export async function updateNextLevelHash(hashLevel: number = 0, nextLevelSelectedObjId: string = '', nextLevelPageId: string = '') {
  // NOTE we have to offset hashLevel by one due to "/#/"

  const hashArr = window.location.hash.split("/");

  // Get this level state array (needed for pageId)
  let stateStr = hashArr[hashLevel + 1];
  if (!stateStr) stateStr = "";
  const sateArr = stateStr.split(".")
  const pageId = sateArr[1]

  // Get next level state array
  let nextLevelStateStr = hashArr[hashLevel + 2];
  if (!nextLevelStateStr) nextLevelStateStr = "";

  // Remove erveything from the hashArr that comes after this level as it no longer valid
  hashArr.splice(hashLevel + 2);

  // Pre-fill new vars with current hash values
  let [newNextLevelSelectObjId, newNextLevelPageId, newNextLevelSelectedTab] = nextLevelStateStr.split(".")

  // Set next level selectedObjId
  // If nextLevelSelectedObjId provided use it, otherwise use this level selectedObjId (this is needed for the menu)
  if (nextLevelSelectedObjId) newNextLevelSelectObjId = nextLevelSelectedObjId

  // Set next level pageId
  // If there is a pageId, use it
  if (nextLevelPageId) {
    newNextLevelPageId = nextLevelPageId;

    // Set next level tabNum
    // See if we can get a selected tab from the last time we visited this page
    const pageSettings = await db.settings.get(nextLevelPageId);
    if (pageSettings && pageSettings.selectedTab) newNextLevelSelectedTab = pageSettings.selectedTab;
    else newNextLevelSelectedTab = '0'

  }

  // Update the next level selectedObj in pageSettings for this ourPageId in the settings db
  const updated = await db.settings.update(pageId, {
    nextLevelSelectedObjId: newNextLevelSelectObjId,
  });
  if (!updated) {
    await db.settings.add({
      pageId: pageId,
      nextLevelSelectedObjId: newNextLevelSelectObjId,
    });
  }

  // Write back to window location hash
  nextLevelStateStr = [newNextLevelSelectObjId, newNextLevelPageId, newNextLevelSelectedTab].join(".");
  hashArr[hashLevel + 2] = nextLevelStateStr;
  const hash = hashArr.join("/");
  window.location.hash = hash;

}



// This method can be called from Page to insert tabNum into hash, for our hashLevel
export async function updateHashWithSelectedTab(hashLevel: number = 0, tabNum: string = '0') {
  // NOTE we have to offset hashLevel by one due to "/#/"

  const hashArr = window.location.hash.split("/");

  // Get state array
  let stateStr = hashArr[hashLevel + 1];
  if (!stateStr) stateStr = "";
  const stateArr = stateStr.split(".");
  let [selectObjId, pageId, selectedTab] = stateStr.split(".")
  selectedTab = tabNum

  // Update the tabNum in pageSettings for this pageId in the settings db
  const updated = await db.settings.update(pageId, {
    selectedTab: selectedTab,
  });
  if (!updated) {
    await db.settings.add({
      pageId: pageId,
      selectedTab: selectedTab,
    });
  }

  // Update the tabNum in the window location hash
  // if tabNum is '0' remove it from the hash for esthetic reasons
  if (selectedTab === "0" && stateArr.length === 3)
    stateArr.splice(2, 1);
  else stateArr[2] = selectedTab;
  stateStr = stateArr.join(".");
  hashArr[hashLevel + 1] = stateStr;
  let hash = hashArr.join("/");
  window.location.hash = hash;

}
