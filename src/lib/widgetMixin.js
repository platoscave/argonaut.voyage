export default {
  data() {
    return {
      selectedObjId: null,
      pageId: null,
      tabNum: 0,
      nextLevelSelectedObjId: null,
      nextLevelPageId: null,
    }
  },
  methods: {
    // Insert selectObjId and pageId into next level hash
    updateNextLevelHash(nodeData) {
      let hashArr = window.location.hash.split("/");
      let nextPageStateStr = hashArr[this.hashLevel + 2];
      if (!nextPageStateStr) nextPageStateStr = "";
      let nextPageStateArr = nextPageStateStr.split(".");
      nextPageStateArr[0] = nodeData._id;
      if (nodeData.pageId && nextPageStateArr[1] !== nodeData.pageId) {
        nextPageStateArr[1] = nodeData.pageId;
        // Remove tab if there is one. Page will find its own tab
        nextPageStateArr.splice(2);
        // Remove erveything that comes after the next level as it no longer valid
        hashArr.splice(this.hashLevel + 3);
      }
      nextPageStateStr = nextPageStateArr.join(".");
      hashArr[this.hashLevel + 2] = nextPageStateStr;
      let hash = hashArr.join("/");
      window.location.hash = hash;
    },

    handleHashChange: function () {
      const hashArr = window.location.hash.split("/")
      
      const ourLevelStr = hashArr[this.hashLevel + 1];
      if (ourLevelStr) {
        const ourLevelArr = ourLevelStr.split(".")
        this.selectedObjId = ourLevelArr[0]
        this.pageId = ourLevelArr[1]
        this.tabNum = ourLevelArr[2]
      }

      const nextLevelStr = hashArr[this.hashLevel + 2];
      if (nextLevelStr) {
        const nextLevelArr = nextLevelStr.split(".")
        this.nextLevelSelectedObjId = nextLevelArr[0]
        this.nextLevelPageId = nextLevelArr[1]
      }
    },
    
  },

  mounted() {
    window.addEventListener("hashchange", this.handleHashChange, false);
    this.handleHashChange();
  },
  beforeDestroy() {
    window.removeEventListener("hashchange", this.handleHashChange, false)
  },
}

