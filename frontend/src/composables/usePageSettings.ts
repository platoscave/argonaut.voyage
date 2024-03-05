// mouse.js
import { ref, reactive, toRefs, onMounted, onUnmounted } from 'vue'
import { db } from "~/services/dexieServices";

interface IPageSettings {
  splitterSettings: number[],
  leftSize: number,
  rightSize: number,
  expandedNodes: string[],
  settingsNextLevelSelectedObjId: string,
  columWidths: {
      propertyName: string,
      width: number
  }[],
  settingsTabNum: string
}
// by convention, composable function names start with "use"
export function usePageSettings(pageId: string = '') {

  // state encapsulated and managed by the composable
  let pageSettings: IPageSettings = reactive({
    splitterSettings: [20, 80],
    leftSize: 300,
    rightSize: 0,
    expandedNodes: [],
    settingsNextLevelSelectedObjId: '',
    columWidths: [],
    settingsTabNum: ''
  })

  if(pageId) {
    db.table('settings').get(pageId).then( localSettings => {
      if(localSettings) pageSettings = Object.assign(pageSettings, localSettings)
      else db.table('settings').add( { pageId:pageId } )
    })
  }

  // expose managed state as return value
  return {
    ...toRefs(pageSettings)
  };
}

export const saveSplitterSettings = (pageId: string, splitterSettings: number[] ) => {
  db.table('settings').update(pageId, {splitterSettings: splitterSettings.map(item => item.size) })
}
export const saveLeftSize = (pageId: string, leftSize: number) => {
  db.table('settings').update(pageId, {leftSize: leftSize})
}
export const saveRightSize = (pageId: string, rightSize: number) => {
  db.table('settings').update(pageId, {rightSize: rightSize})
}
export const saveExpandedNodes = (pageId: string, expandedNodes: string[]) => {
  db.table('settings').update(pageId, {expandedNodes: expandedNodes})
}
export const saveTabNum = (pageId: string, tabNum: string) => {
  db.table('settings').update(pageId, {settingsTabNum: tabNum})
}
export const saveColumWidth = (pageId: string, propertyName: string, width: number) => {
  const colPropName = "columWidths."+propertyName
  let updateObj: any = {}
  updateObj[colPropName] = width
  db.table('settings').update(pageId, updateObj )
}

