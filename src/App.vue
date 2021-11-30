<template>
  <div id="app">
    <ar-layout class="ar-main" :hash-level="0"></ar-layout>

    <div class="ar-footer">
      <i
        class="el-icon-setting ar-left-align"
        @click="dialogVisible = true"
      ></i>
      <el-select
        class="ar-left-align"
        size="mini"
        placeholder="Select Network"
        :value="appSettings ? appSettings.currentNetwork : ''"
        @input="updateCurrentNetwork"
      >
        <el-option
          v-for="network in networks"
          :key="network"
          :label="network"
          :value="network"
        >
        </el-option>
      </el-select>
      <el-select
        class="ar-left-align"
        size="mini"
        placeholder="Select User"
        :value="appSettings ? appSettings.currentUser : ''"
        @input="updateCurrentUser"
      >
        <el-option
          v-for="user in users"
          :key="user._id"
          :label="user.name"
          :value="user._id"
        >
        </el-option>
      </el-select>
      <div class="ar-right-align logo is-animation">
        <span>a</span>
        <span>r</span>
        <span>g</span>
        <span>o</span>
        <span>n</span>
        <span>a</span>
        <span>u</span>
        <span>t</span>
        <span>.</span>
        <span>v</span>
        <span>o</span>
        <span>y</span>
        <span>a</span>
        <span>g</span>
        <span>e</span>
      </div>
    </div>
    <settings-dlg ref="settingsDlg" v-model="dialogVisible"> </settings-dlg>
  </div>
</template>

<script>
import networks from "./config/networks.js";
import SettingsDlg from "./components/SettingsDlg.vue";
import Layout from "./components/Layout.vue";
import PouchDB from "pouchdb-browser";

export default {
  name: "App",
  components: {
    SettingsDlg,
    "ar-layout": Layout,
  },
  data() {
    return {
      dialogVisible: false,
      networks: Object.keys(networks),
    };
  },
  pouch: {
    users: function() {
      return {
        database: "argonautdb",
        selector: { classId: "hdt3hmnsaghk" },
        fields: ["_id", "name"],
        sort: ["name"],
      };
    },
    appSettings: function() {
      return {
        database: "settings",
        selector: { _id: "appSettings" },
        first: true,
      };
    },
  },

  methods: {
    updateCurrentNetwork(value) {
      this.$settings.upsert("appSettings", (doc) => {
        doc.currentNetwork = value;
        return doc;
      });
    },
    updateCurrentUser(value) {
      this.$settings.upsert("appSettings", (doc) => {
        doc.currentUser = value;
        return doc;
      });
    },
  },

  mounted: async function() {
    // If argonautdb is not filled yet, populate it from the static file
    const argonautdb = new PouchDB("argonautdb");
    let details = await argonautdb.info();
    if (details.doc_count == 0 && details.update_seq == 0) {
      await this.$refs["settingsDlg"].populateFromStatic();
    }

    // Fill in defaults for new users.
    details = await this.$settings.info();
    if (details.doc_count == 0 && details.update_seq == 0) {
      await this.$settings.put({
        _id: "appSettings",
        currentNetwork: "sandbox",
        currentUser: "demouser1111",
      });
    }

    if (!window.location.hash)
      window.location.hash = "#/argonautvoya.uhekisbbbjh5";
  },
};
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
body {
  margin: 0px;
  overflow: hidden;
}
.ar-full-height {
  height: 100%;
}

/* Various global fixes */

/* Fix message box */
.el-message__content {
  color: #eee !important;
  font-family: Avenir, Helvetica, Arial, sans-serif;
}
/* Fix drop down */
li.el-select-dropdown__item {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  font-size: 16px;
  line-height: 28px;
}
.el-scrollbar {
  background: #232323;
  border-color: #524f4f;
  border-style: solid;
  border-radius: 6px;
  border-width: 1px;
}
/* Fix Tooltip */
div.el-tooltip__popper.is-dark {
  background: #232323;
  border-color: #524f4f;
  border-style: solid;
  border-radius: 6px;
  border-width: 1px;
  color: #eee !important;
  font-family: Avenir, Helvetica, Arial, sans-serif;
  font-size: 16px;
  line-height: 28px;
}

/* Controls */
.ar-control > input {
  background-color: #ffffff08;
  border-color: #00adff42;
  font-size: 16px;
  height: 24px;
}
.ar-control > input[readonly] {
  border-style: none;
}
label{
  line-height: 24px;
}

.ar-rodiv.ar-control {
  background-color: #ffffff08;
  padding-left: 10px;
  padding-right: 10px;
  border-radius: 4px;
  border-style: none;
  font-size: 16px;
  line-height: 30px;
  margin-right: 10px;
}

/* Dark mode scroll bars */
::-webkit-scrollbar {
  width: 8px;
  height: 3px;
}
::-webkit-scrollbar-button {
  background-color: #666;
}
::-webkit-scrollbar-track {
  background-color: #646464;
}
::-webkit-scrollbar-track-piece {
  background-color: #000;
}
::-webkit-scrollbar-thumb {
  height: 50px;
  background-color: #666;
  border-radius: 3px;
}
::-webkit-scrollbar-corner {
  background-color: #646464;
}
::-webkit-resizer {
  background-color: #666;
}
</style>





<style scoped>
/* Scoped styles */


.ar-main {
  height: calc(100vh - 40px);
  padding: 0px;
  overflow: auto;
  display: block;
  width: 100%;
}
.ar-footer {
  background: #ffffff08;
  border-top-color: #524f4f;
  border-top-width: 1px;
  border-top-style: solid;
  height: 39px;
}
.el-select {
  width: 175px;
}
.el-select >>> .el-input__inner {
  font-size: 16px;
}
.ar-left-align {
  float: left;
  margin-left: 10px;
  position: relative;
  top: 50%;
  -webkit-transform: translateY(-50%);
  -ms-transform: translateY(-50%);
  transform: translateY(-50%);
  line-height: 100%;
}
.ar-right-align {
  float: right;
  margin-right: 10px;
  position: relative;
  top: 50%;
  -webkit-transform: translateY(-50%);
  -ms-transform: translateY(-50%);
  transform: translateY(-50%);
  line-height: 100%;
}

/* Animante logo */
.logo.is-animation {
  margin-top: 0.3em;
}

.logo.is-animation span {
  display: inline-block;
  animation: wave-text 3s ease-in-out infinite;
}

.logo.is-animation {
  span:nth-of-type(1) {
    animation-delay: 0s;
  }
  span:nth-of-type(2) {
    animation-delay: 0.1s;
  }
  span:nth-of-type(3) {
    animation-delay: 0.2s;
  }
  span:nth-of-type(4) {
    animation-delay: 0.3s;
  }
  span:nth-of-type(5) {
    animation-delay: 0.4s;
  }
  span:nth-of-type(5) {
    animation-delay: 0.5s;
  }
  span:nth-of-type(5) {
    animation-delay: 0.6s;
  }
  span:nth-of-type(5) {
    animation-delay: 0.7s;
  }
  span:nth-of-type(5) {
    animation-delay: 0.8s;
  }
  span:nth-of-type(5) {
    animation-delay: 0.9s;
  }
  span:nth-of-type(5) {
    animation-delay: 1.0s;
  }
  span:nth-of-type(5) {
    animation-delay: 1.0s;
  }
  span:nth-of-type(5) {
    animation-delay: 1.1s;
  }
  span:nth-of-type(5) {
    animation-delay: 1.2s;
  }
  span:nth-of-type(5) {
    animation-delay: 1.3s;
  }
  span:nth-of-type(5) {
    animation-delay: 1.4s;
  }
  span:nth-of-type(5) {
    animation-delay: 1.5s;
  }
  
}

@keyframes wave-text {
  00% {
    transform: translateY(0em);
  }
  60% {
    transform: translateY(-0.3em);
  }
  100% {
    transform: translateY(0em);
  }
}
</style>
