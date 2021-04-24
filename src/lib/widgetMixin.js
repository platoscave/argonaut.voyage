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
      const hashArr = window.location.hash.split("/");

      // Get our selectedObjId in case we need it later on
      const ourPageStateStr = hashArr[this.hashLevel + 1];
      const ourPageStateArr = ourPageStateStr.split(".");
      const ourSelectObjId = ourPageStateArr[0]

      // Get next level
      let nextPageStateStr = hashArr[this.hashLevel + 2];
      if (!nextPageStateStr) nextPageStateStr = "";
      const nextPageStateArr = nextPageStateStr.split(".");

      // Next level selectedObjId
      // If nodeData has an id use it, otherwise use this level selectedObjId
      if(nodeData._id) nextPageStateArr[0] = nodeData._id
      else nextPageStateArr[0] = ourSelectObjId

      // Next level pageId
      // If nodeData has a pageId and it is different than the curren one, replace it
      if (nodeData.pageId && nextPageStateArr[1] !== nodeData.pageId) {
        nextPageStateArr[1] = nodeData.pageId;
        // Remove tab if there is one. Page will find its own tab
        nextPageStateArr.splice(2);
        // Remove erveything that comes after the next level as it no longer valid
        hashArr.splice(this.hashLevel + 3);
      }

      // Write back to window location hash
      nextPageStateStr = nextPageStateArr.join(".");
      hashArr[this.hashLevel + 2] = nextPageStateStr;
      const hash = hashArr.join("/");
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

