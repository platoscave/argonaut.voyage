import WidgetMixin from "../../lib/widgetMixin";

export default {
  name: "ar-navigation-menu",
  mixins: [WidgetMixin],

  props: {
    hashLevel: Number,
    menuId: String,
  },

  pouch: {
    menuObj: function () {
      return {
        database: "blockprocess",
        selector: { _id: this.menuId },
        first: true,
      };
    },
    currentObj: function () {
      return {
        database: "blockprocess",
        selector: { _id: this.selectedObjId },
        first: true,
      };
    },
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

      return findIndexPathForPageId( this.nextLevelPageId, this.menuObj.menuArr, '')
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
            attrs: { src: this.currentObj.icon },
            style: { }
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
                this.updateNextLevelHash( { _id: item.nextLevelSelectedObjId, pageId: item.pageId })
              }
            }
          }, labelElement(item, index === '' ? true : false)))
        }
      })
      return subMenuArr
    }

    // START HERE
    // Create the menu element
    if (!this.menuObj || !this.currentObj) return // hasn't been filled yet

    return createElement('el-menu', {
      props: {
        'unique-opened': true,
        'default-active': this.defaultActive
      },
    }, [createElement('h3', { style: { 'padding-left': '20px' } }, labelElement(this.currentObj)),
    ...createSubMenu(this.menuObj.menuArr, '')])
  },

};

