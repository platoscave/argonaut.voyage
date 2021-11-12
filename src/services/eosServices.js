/* eslint-disable no-console */
import {
  Api,
  JsonRpc,
  RpcError
} from 'eosjs'
import {
  JsSignatureProvider
} from 'eosjs/dist/eosjs-jssig'
import testAccounts from '../config/testaccounts.js'
import networks from '../config/networks.js'
import BigNumber from "../../node_modules/big.js"
import {
  encodeName,
  decodeName
} from '../lib/format.js'
import PouchDB from 'pouchdb-browser'
import PoucdbServices from "../services/pouchdbServices";


const blockProcessDb = new PouchDB('blockprocess');
const settingsDb = new PouchDB('settings');

// See https://eosio.github.io/eosjs/latest/how-to-guides/index


// Main action call to blockchain
async function takeAction(actions) {


  let appSettings = await settingsDb.get('appSettings')
  const network = appSettings.currentNetwork;
  const rpc = new JsonRpc(networks[network].endpoint);


  const actor = appSettings.currentUser;
  const privateKey = testAccounts[actor].privateKey
  const signatureProvider = new JsSignatureProvider([privateKey])

  const api = new Api({
    rpc,
    signatureProvider,
    textDecoder: new TextDecoder(),
    textEncoder: new TextEncoder()
  })

  // Main call to blockchain after setting action, account_name and data
  try {
    const resultWithConfig = await api.transact({
      actions: actions
    }, {
      blocksBehind: 3,
      expireSeconds: 30
    })

    return resultWithConfig

  } catch (err) {
    if (err instanceof RpcError) {
      console.log('actions in error', actions)
      throw 'EOS Transaction Failed:\n' + err.json.error.details[0].message
    }
    else {
      throw err
    }
  }
}

class EosApiService {


  static async upsertDocument( document) {

    const getRandomKey = () => {
      // base32 encoded 64-bit integers. This means they are limited to the characters a-z, 1-5, and '.' for the first 12 characters.
      // If there is a 13th character then it is restricted to the first 16 characters ('.' and a-p).
      var characters = 'abcdefghijklmnopqrstuvwxyz12345'
      var randomKey = ''
      for (var i = 0; i < 12; i++) {
        randomKey += characters.charAt(Math.floor(Math.random() * characters.length))
      }
      return randomKey
    }
    if (!document._id) document._id = getRandomKey()

    

    let appSettings = await settingsDb.get('appSettings')
    let currentUserId = appSettings.currentUser

    const actions = [{
      account: 'blockprocess',
      name: 'upsert',
      authorization: [{
        actor: currentUserId,
        permission: 'active'
      }],
      data: {
        payload: {
          username: currentUserId,
          document: JSON.stringify(document)
        }
      }
    }]
    return takeAction(actions)
  }


  //////////////////////////////////////////////////////////
  // Utility functions
  //////////////////////////////////////////////////////////



  static async addTestAccounts(message) {

    // Prime EOS with test accounts from the cache
    // Acounts must be created in the right order because eos does a referential integrity check
    // We do each of the accounts in its own transaction in case the account aready exists
    // I get get_block_info 404 (Not Found) when I run this locally but it doesnt seem to matter


    const addAccount = async actionArr => {
      // buyrambytes and delegatebw only needed when the eos system contract is running
      actionArr.splice(1, 2)
      try {
        await takeAction(actionArr)
        message({ message: actionArr[0].data.name + ' Added', type: "succes" });
      } catch (err) {
        console.error(err) // Dont care
        message({ message: err, type: "error" });
      }
    }

    // START HERE
    let appSettings = await settingsDb.get('appSettings')
    let currentUserId = appSettings.currentUser

    const response = await fetch("addTestAccountActions.json");
    let accountActionsStr = await response.text();
    accountActionsStr = accountActionsStr.replace(/currentUserId/g, currentUserId)
    const accountActionsArr = JSON.parse(accountActionsStr)
    console.log(accountActionsArr)


    let promisesArr = []
    accountActionsArr.forEach(actionArr => {
      promisesArr.push(addAccount(actionArr))
    })
    await Promise.all(promisesArr)
    console.log('accounts added')

  }


  static async staticToEos(message) {

    let appSettings = await settingsDb.get('appSettings')
    let currentUserId = appSettings.currentUser

    const upsertActions = tenDocs => {
      return tenDocs.map(item => {
        return {
          account: 'blockprocess',
          name: 'upsert',
          authorization: [{
            actor: currentUserId,
            permission: 'active'
          }],
          data: {
            payload: {
              username: currentUserId,
              document: JSON.stringify(item)
            }
          }
        }
      })
    }


    const doAllSequentually = async (fnPromiseArr) => {
      for (let i = 0; i < fnPromiseArr.length; i++) {
        await fnPromiseArr[i]()
      }
    }


    // START HERE

    const response = await fetch("blockprocess.json");
    const blockprocessArr = await response.json();
    //console.log(blockprocessArr)


    let promiseFunctionArr = []
    for (let idx = 0; idx < blockprocessArr.length; idx += 1) {
      let tenDocs = []
      for (let subIdx = 0; subIdx < 1; subIdx++) {
        tenDocs.push(blockprocessArr[idx + subIdx])
      }
      let tenActionsArr = upsertActions(tenDocs)
      promiseFunctionArr.push(async () => {
        try {
          await takeAction(tenActionsArr)
          message({ message: 'Upsert ten', type: "success" });
        } catch (err) {
          console.error(err) // Dont care
          message({ message: err, type: "error" });
        }
      })
    }
    doAllSequentually(promiseFunctionArr)

  }



  static async cacheToEos(message) {

    let appSettings = await settingsDb.get('appSettings')
    let currentUserId = appSettings.currentUser

    const upsertActions = tenDocs => {
      return tenDocs.map(item => {
        return {
          account: 'blockprocess',
          name: 'upsert',
          authorization: [{
            actor: currentUserId,
            permission: 'active'
          }],
          data: {
            payload: {
              username: currentUserId,
              document: JSON.stringify(item.doc)
            }
          }
        }
      })
    }


    // START HERE
    var pageSize = 10;
    var lastSeq = 0;
    const fetchNextPage = async () => {
      const changes = await blockProcessDb.changes({
        since: lastSeq,
        limit: pageSize,
        include_docs: true
      })
      console.log('\nFound the following changes:');
      //changes.results.forEach(function (change) {
        console.log(JSON.stringify(changes));
      //});
      let tenActionsArr = upsertActions(changes.results)
      await takeAction(tenActionsArr)

      if (changes.results.length < pageSize) {
        // done!
      } else {
        lastSeq = changes.last_seq;
        return fetchNextPage();
      }
    }


    fetchNextPage().catch(function (err) {
      message({ message: err, type: "error" });
    });
    //console.log(blockprocessArr)


  }


  static async eraseAllEos() {

    let appSettings = await settingsDb.get('appSettings')
    let currentUserId = appSettings.currentUser

    const actions = [{
      account: 'blockprocess',
      name: 'eraseall',
      authorization: [{
        actor: currentUserId,
        permission: 'active'
      }],
      data: {
        payload: {
          username: currentUserId
        }
      }
    }]
    return takeAction(actions)
  }





  static async testEos(testObject) {
    
/*     const high = new BigNumber('18446744073709551616')
    debugger
    console.log(high.toString())
    const upperBound = decodeName(0, false)
    console.log(upperBound)

return */
    const printTraces = result => {
      console.log(result.console)
      if (result.inline_traces.length) printTraces(result.inline_traces[0])
    }

    //const document = await blockProcessDb.get('ikjyhlqewxs3')

    const result = await this.upsertDocument(testObject)

    console.log('results')
    printTraces(result.processed.action_traces[0])


    return result

  }
}

export default EosApiService