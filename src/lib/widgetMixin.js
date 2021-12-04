import { db } from "../services/dexieServices";

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

    // This method can be called when a user selects a tree node or a table row
    // The nodeData._id will be placed in next level selectObjId
    // If the nodeData has a pageId it will be placed in next level pageId
    async updateNextLevelHash(nodeData) {
      
      // Get next level state array
      let nextLevelStateStr = hashArr[this.hashLevel + 2];
      if (!nextLevelStateStr) nextLevelStateStr = "";
      const nextLevelStateArr = nextLevelStateStr.split(".");
      const hashArr = window.location.hash.split("/");

      // Remove erveything from the hashArr that comes after this level as it no longer valid
      hashArr.splice(this.hashLevel + 2);

      let newNextLevelSelectObjId = nextLevelStateArr[0]
      let newNextLevelPageId = nextLevelStateArr[1]
      let newNextLevelSelectedTab = nextLevelStateArr[2]
      let newAfterNextLevelSelectObjId = ''


      // Set next level selectedObjId
      // If nodeData has an id use it, otherwise use this level selectedObjId (this is needed for the menu)
      if (nodeData._id) newNextLevelSelectObjId = nodeData._id

      // If there is a pageId and it is different than the current one, use it
      if (nodeData.pageId && nextLevelStateArr[1] !== nodeData.pageId) {
        newNextLevelPageId = nodeData.pageId;

        // See if we can get a selected tab from the last time we visited this page
        const pageSettings = await db.settings.get(nodeData.pageId);
        if (pageSettings && pageSettings.selectedTab) newNextLevelSelectedTab = pageSettings.selectedTab;
        else newNextLevelSelectedTab = 0

        // See if we can get a after next level selected object from the last time we visited this page
        if (pageSettings && pageSettings.nextLevelSelectObjId) newAfterNextLevelSelectObjId = pageSettings.nextLevelSelectObjId

        console.log("widgetMixin", this.hashLevel, nodeData.pageId, pageSettings);
      }

      // Update the next level selectedObj in pageSettings for this ourPageId in the settings db
      const updated = await db.settings.update(this.pageId, {
        nextLevelSelectObjId: newNextLevelSelectObjId,
      });
      if (!updated) {
        await db.settings.add({
          pageId: this.pageId,
          nextLevelSelectObjId: newNextLevelSelectObjId,
        });
      }

      // Write back to window location hash
      nextLevelStateStr = [newNextLevelSelectObjId, newNextLevelPageId, newNextLevelSelectedTab].join(".");
      hashArr[this.hashLevel + 2] = nextLevelStateStr;
      if(newAfterNextLevelSelectObjId) hashArr[this.hashLevel + 3] = newAfterNextLevelSelectObjId;
      const hash = hashArr.join("/");
      window.location.hash = hash;
    },

    handleHashChange: function () {
      //if(this.hashLevel === 1) console.log("widgetMixin", nodeData.pageId, pageSettings);

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

