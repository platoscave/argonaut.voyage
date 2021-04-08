export default {
  name: "ar-navigation-menu",
  props: {
    hashLevel: Number,
    viewId: String,
  },
  data() {
    return {
      menuArr: [
        {
          name: 'Home',
          icon: 'el-icon-s-home',
          pageId: ''
        },
        {
          name: 'Reception',
          icon: 'el-icon-s-custom',
          pageId: ''
        },
        {
          name: 'Human Resources',
          icon: 'el-icon-user-solid',
          pageId: '',
          subMenu: [
            {
              name: 'Income Statement',
              pageId: '',
            },
            {
              name: 'Balance Sheet',
              pageId: '',
            },
            {
              name: 'Cash Flow',
              pageId: '',
            },
          ]
        },
        {
          name: 'Accounting',
          icon: 'el-icon-picture-outline',
          pageId: '',
          subMenu: [
            {
              name: 'Invoice',
              pageId: '',
            },
            {
              name: 'Purchase',
              pageId: '',
            },
            {
              name: 'Financials',
              subMenu: [
                {
                  name: 'Income Statement',
                  pageId: '',
                },
                {
                  name: 'Balance Sheet',
                  pageId: '',
                },
                {
                  name: 'Cash Flow',
                  pageId: '',
                },
              ]
            },
          ]
        },
        {
          name: 'Modeling',
          icon: 'el-icon-picture',
          pageId: '',
          subMenu: [
            {
              name: 'Class Model',
              pageId: '4lk3hxyyfac3',
            }, {
              name: 'Process Model',
              pageId: '',
            }, {
              name: 'Page Model',
              pageId: '',
            }, {
              name: 'Organization',
              pageId: '',
            },
          ]
        },
      ],
    }
  },
  render(createElement) {

    // Label, potentially containing an icon
    const labelElement = (item) => {
      let labelArr = []

      if (item.icon) labelArr.push(createElement('i', { class: item.icon }))
      labelArr.push(createElement('span', item.name))

      return labelArr
    }

    // Create an array of (sub-) menu items. Called recursivly
    const createSubMenu = (menuArr, index) => {
      let subMenuArr = []

      menuArr.forEach((item, idx) => {
        if (item.subMenu) {
          subMenuArr.push(createElement('el-submenu', {
            props: {
              index: index + '-' + idx,
              pageId: item.pageId
            },
          }, 
          [
            createElement("span", { slot: "title" }, labelElement(item)),
            ...createSubMenu(item.subMenu, index + '-' + idx)
          ]))
        }
        else {
          subMenuArr.push(createElement('el-menu-item', {
            props: {
              index: index + '-' + idx,
              pageId: item.pageId
            },
            on: {
              click: () => {
                this.updateNextLevelHashSelectedObjId(item.pageId)
              }
            }
          }, labelElement(item)))
        }
      })
      return subMenuArr
    }

    // Create the menu element
    return createElement('el-menu', {
      ref: "elMenu",
      props: {
        'unique-opened': true
      },
      class: 'form-class'
    }, createSubMenu(this.menuArr, ''))
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
  },
};

