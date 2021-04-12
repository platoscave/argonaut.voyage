export default {
  name: "ar-navigation-menu",
  props: {
    hashLevel: Number,
    menuId: String,
  },

  data: function () {
    return {
      nextLevelPageId: '',
    };
  },

  pouch: {
    menuObj: function () {
      return {
        database: "argonaut",
        selector: { _id: this.menuId },
        first: true,
      };
    },
  },

  computed: {
    // Get the index if the menuItem the corresponds to the next level pageId
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

      if (item.icon) labelArr.push(createElement('i', { class: item.icon }))

      let style = {}
      if (firstLevel) style = { style: { 'font-weight': 'bold', 'font-size': '16px' } }

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
                this.updateNextLevelHashSelectedObjId(item.pageId)
              }
            }
          }, labelElement(item, index === '' ? true : false)))
        }
      })
      return subMenuArr
    }

    // Create the menu element
    if (!this.menuObj) return // hasn't been filled yet

    return createElement('el-menu', {
      props: {
        'unique-opened': true,
        'default-active': this.defaultActive
      },
    }, [createElement('h3', { style: { 'text-align': 'center' } }, this.menuObj.name),
    ...createSubMenu(this.menuObj.menuArr, '')])
  },

  methods: {

    // Insert selectObjId and pageId into next level hash
    updateNextLevelHashSelectedObjId(pageId) {
      let hashArr = window.location.hash.split("/");

      let ourPageStateStr = hashArr[this.hashLevel + 1];
      let ourPageStateArr = ourPageStateStr.split(".");
      let ourSelectObjId = ourPageStateArr[0]

      let nextPageStateStr = hashArr[this.hashLevel + 2];
      if (!nextPageStateStr) nextPageStateStr = "";
      let nextPageStateArr = nextPageStateStr.split(".");
      nextPageStateArr[0] = ourSelectObjId; //copy our selectedObjId
      if (pageId && nextPageStateArr[1] !== pageId) {
        nextPageStateArr[1] = pageId;
        // Remove tab if there is one. Page find its own tab
        nextPageStateArr.splice(2);
        // Remove erveything that comes after the next level as it no longer valid
        hashArr.splice(this.hashLevel + 3);
      }
      nextPageStateStr = nextPageStateArr.join(".");
      hashArr[this.hashLevel + 2] = nextPageStateStr;
      //TODO remove following levels, fill with defaults
      let hash = hashArr.join("/");
      window.location.hash = hash;
    },

    handleHashChange: function () {
      const nextLevelStr = window.location.hash.split("/")[this.hashLevel + 2];
      if (nextLevelStr) {
        const nextLevelArr = nextLevelStr.split(".");
        this.nextLevelPageId = nextLevelArr[1]
      }
    },
  },

  mounted() {
    window.addEventListener("hashchange", this.handleHashChange, false);
    this.handleHashChange();
  },
  beforeDestroy() {
    window.removeEventListener("hashchange", this.handleHashChange, false);
  },
};

