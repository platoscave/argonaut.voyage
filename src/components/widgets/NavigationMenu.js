import { db } from "../../services/dexieServices";
import { liveQuery } from "dexie";
import { pluck, switchMap, filter, distinctUntilChanged } from "rxjs/operators";
import WidgetMixin from "../../lib/widgetMixin";

export default {
  name: "ar-navigation-menu",
  mixins: [WidgetMixin],

  props: {
    hashLevel: Number,
    menuId: String,
  },

  subscriptions() {
    //
    // Watch the selectedObjId as observable
    const selectedObjId$ = this.$watchAsObservable("selectedObjId", {
      immediate: true,
    })
      .pipe(pluck("newValue")) // Obtain value from reactive var (whenever it changes)
      .pipe(filter((selectedObjId) => selectedObjId)) //filter out falsy values
      .pipe(distinctUntilChanged()); // emit only when changed

    // Whenever selectedObjId changes, reset the live query with the new selectedObjId
    const dataObj$ = selectedObjId$.pipe(
      switchMap(this.getOrgTree)
    );

    return {
      dataObj: dataObj$,
      //TODO does the this.menuId ever change?
      menuObj: liveQuery(() =>
        db.state.where({ _id: this.menuId }).first()
      ),
    }
  },
  methods: {
    async getOrgTree(_id) {
      return db.state.where({ _id: _id }).first()
    }
  },
  computed: {
    // Get the index if the menuItem that corresponds to the next level pageId
    // We do this in computed because menuObj is async
    defaultActive: function () {

      const findIndexPathForPageId = (pageId, menuArr, index) => {
        for (let idx in menuArr) {
          let item = menuArr[idx]
          if (item.pageId === pageId) return index + '-' + idx
          if (item.menuArr) {
            let result = findIndexPathForPageId(pageId, item.menuArr, index + '-' + idx)
            if (result) return result
          }
        }
      }

      return findIndexPathForPageId(this.nextLevelPageId, this.menuObj.menuArr, '')
    }
  },

  render(createElement) {

    // Label, potentially containing an icon
    const labelElement = (item, firstLevel) => {
      let labelArr = []


      // TODO replace icons in menu then remove the else branch
      if (item.icon) {
        if (item.icon.startsWith('data:image/')) {
          labelArr.push(createElement("img", {
            attrs: { src: this.dataObj.icon },
            style: {}
          }))
        }
        else labelArr.push(createElement('i', { class: item.icon }))
      }

      let style = {}
      if (firstLevel) style = { style: { 'font-weight': 'bold' } }
      //else style = { style: { 'left-padding': '48px' } }

      labelArr.push(createElement('span', style, item.name))

      return labelArr
    }

    // Create an array of (sub-) menu items. Called recursivly
    const createSubMenu = (menuArr, index) => {
      let subMenuArr = []

      menuArr.forEach((item, idx) => {
        if (item.menuArr) {
          subMenuArr.push(createElement('el-submenu', {
            props: {
              index: index + '-' + idx,
              disabled: item.menuArr.length ? false : true
            },
          },
            [
              createElement("span", { slot: "title" }, labelElement(item, index === '' ? true : false)),
              ...createSubMenu(item.menuArr, index + '-' + idx)
            ]))
        }
        else {
          subMenuArr.push(createElement('el-menu-item', {
            props: {
              index: index + '-' + idx,
              disabled: item.pageId ? false : true
            },
            on: {
              click: () => {
                const nextLevelSelectedObjId = item.nextLevelSelectedObjId ? item.nextLevelSelectedObjId :this.selectedObjId
                this.updateNextLevelHash({ _id: nextLevelSelectedObjId, pageId: item.pageId })
              }
            }
          }, labelElement(item, index === '' ? true : false)))
        }
      })
      return subMenuArr
    }

    // START HERE
    // Create the menu element
    if (!this.menuObj || !this.dataObj) return // hasn't been filled yet

    return createElement('el-menu', {  
      style: {
        height: '100%',
        overflow: 'auto',
      },
      props: {
        'unique-opened': true,
        'default-active': this.defaultActive
      },
    }, [createElement('h3', { style: { 'padding-left': '20px' } }, labelElement(this.dataObj)),
    ...createSubMenu(this.menuObj.menuArr, '')])
  },

};

