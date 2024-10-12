/* eslint-disable no-console */
import { db } from "../services/dexieServices";
import { getClassSchema } from "~/lib/argoUtils"
// Use these if your script is NOT hosted by psinode:
import { getTaposForHeadBlock, signAndPushTransaction } from "http://psibase.127.0.0.1.sslip.io:8080/common/common-lib.js";
import testAccounts from '../config/testaccounts.js'
import networks from '../config/networks.js'
//import BigNumber from "../../node_modules/big.js"
// import {
//   encodeName,
//   decodeName
// } from '../lib/format.js'




//////////////////////////////////////////////////////////
// Main action call to blockchain
//////////////////////////////////////////////////////////


async function takeAction(actions) {


  let networkUserObj = await db.table('settings').get('application')
  const network = networkUserObj.currentNetwork;
  //const rpc = new JsonRpc(networks[network].endpoint);
  const baseUrl = networks[network].endpoint;
  //const baseUrl = '';


  const actor = networkUserObj.currentUserId;
  const privateKey = testAccounts[actor].privateKey
  // const signatureProvider = new JsSignatureProvider([privateKey])

  // const api = new Api({
  //   rpc,
  //   signatureProvider,
  //   textDecoder: new TextDecoder(),
  //   textEncoder: new TextEncoder()
  // })

  // Main call to blockchain after setting action, account_name and data
  try {
    const transaction = {
      tapos: {
        ...await getTaposForHeadBlock(baseUrl),
        // expire after 10 seconds
        expiration: new Date(Date.now() + 10000),
      },
      actions: actions
      // actions: [
      //   {
      //     sender: "sue",          // account requesting action
      //     service: "example",     // service executing action
      //     method: "add",          // method to execute
      //     data: {                 // arguments to method
      //       "a": 0,
      //       "b": 0
      //     }
      //   }
      // ],
    };
    const privateKeys = [
    ////  'PVT_K1_2bfGi9rYsXQSXXTvJbDAPhHLQUojjaNLomdm3cEJ1XTzMqUt3V',
    ];

    // Don't forget the await!
    const trace = await signAndPushTransaction(baseUrl, transaction, privateKeys, false);

    console.log("Transaction executed");
    console.log("\ntrace:", JSON.stringify(trace, null, 4));

    return trace
  } catch (err) {
    console.log("Caught exception:", err.message);
    if (err.trace) {
      console.log(JSON.stringify(err.trace, null, 4));
      throw 'Psibase Transaction Failed:\n' + err.json.error.details[0].message
    } else throw err
  }



  // try {
  //   const resultWithConfig = await api.transact({
  //     actions: actions
  //   }, {
  //     blocksBehind: 3,
  //     expireSeconds: 30
  //   })

  //   return resultWithConfig

  // } catch (err) {
  //   if (err instanceof RpcError) {
  //     console.log('actions in error', actions)
  //     throw 'Psibase Transaction Failed:\n' + err.json.error.details[0].message
  //   }
  //   else {
  //     throw err
  //   }
  // }
}

class PsibaseApiService {


  //////////////////////////////////////////////////////////
  // Upsert Documents
  //////////////////////////////////////////////////////////


  static async upsertDocument(document) {

    let networkUserObj = await db.table('settings').get('application')
    let currentUserId = networkUserObj.currentUserId

    const actions = [{
      account: 'argonautvoya',
      name: 'upsert',
      authorization: [{
        actor: 'argonautvoya',
        permission: 'active'
      }],
      data: {
        username: 'argonautvoya',
        key: document.key,
        classId: document.classId ? document.classId : 'aaaaaaaaaaaaa', // 13 * 'a' equals 0
        superClassId: document.superClassId ? document.superClassId : 'aaaaaaaaaaaaa',
        ownerId: document.ownerId ? document.ownerId : 'aaaaaaaaaaaaa',
        document: JSON.stringify(document)
      }
    }]
    return takeAction(actions)
  }



  static async staticToPsibase($message) {
    const response = await fetch("data/classes.json");
    const classesArr = await response.json();
    //this.sendUpsertBatches(argonautArr, $message)
    const actions = [
      {
        sender: "argonaut",          // account requesting action
        service: "argonaut",     // service executing action
        method: "upsert",          // method to execute
        data: JSON.stringify(classesArr) 
      }
    ]
    await takeAction(actions)

  }

  static async sendUpsertBatches(argonautArr, $message) {

    //let networkUserObj = await db.table('settings').get("application")
    //let currentUserId = networkUserObj.currentUserId

    const upsertActions = tenDocs => {
      return tenDocs.map(item => {
        return {
          account: 'argonautvoya',
          name: 'upsert',
          authorization: [{
            actor: 'argonautvoya',
            permission: 'active'
          }],
          data: {
            username: 'argonautvoya',
            key: item.key,
            classId: item.classId ? item.classId : 'aaaaaaaaaaaaa', // 13 * 'a' equals 0
            superClassId: item.superClassId ? item.superClassId : 'aaaaaaaaaaaaa',
            ownerId: item.ownerId ? item.ownerId : 'aaaaaaaaaaaaa',
            document: JSON.stringify(item)
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

    const batchSize = 10


    let promiseFunctionArr = []
    for (let idx = 0; idx < argonautArr.length; idx += batchSize) {

      let tenDocs = []
      for (let subIdx = 0; subIdx < batchSize && idx + subIdx < argonautArr.length; subIdx++) {
        tenDocs.push(argonautArr[idx + subIdx])
      }
      console.log('tenDocs', tenDocs)
      let tenActionsArr = upsertActions(tenDocs)
      promiseFunctionArr.push(async () => {
        try {
          await takeAction(tenActionsArr)
          $message({ message: 'Upsert ten', type: "success" });
        } catch (err) {
          console.error(err) // Dont care
          $message({ message: err.reason.message, type: "error" });
        }
      })
    }
    doAllSequentually(promiseFunctionArr)

  }



  //////////////////////////////////////////////////////////
  // Get Docuemnts
  //////////////////////////////////////////////////////////

  static async getDocumentByKey(keyValue) {
    const resultArr = await this.getDocuments(keyValue, 'key')
    return resultArr[0]
  }


  static async getDocuments(keyValue, indexName) {

    let networkUserObj = await db.table('settings').get('application')
    const network = networkUserObj.currentNetwork;
    const rpc = new JsonRpc(networks[network].endpoint);

    const lowerBoundBigNumber = new BigNumber(encodeName(keyValue, false))
    const upperBound = decodeName(lowerBoundBigNumber.plus(1).toString(), false)
    // console.log('indexName: ', indexName, 'key: ', key, lowerBoundBigNumber.toString(), lowerBoundBigNumber.plus(1).toString())

    let index = ''
    if (!indexName || indexName === 'key') index = 'first'
    else if (indexName === 'classId') index = 'second'
    else if (indexName === 'superClassId') index = 'third'
    else if (indexName === 'ownerId') index = 'forth'
    else throw 'Add index: ' + indexName


    const rowsArr = await rpc.get_table_rows({
      json: true,                 // Get the response as json
      code: 'argonautvoya',       // Contract that we target
      scope: 'argonautvoya',      // Account that owns the data
      table: 'argonautvoya',      // Table name
      index_position: index,      // Table index
      lower_bound: keyValue,      // Table key value
      upper_bound: upperBound,    // must be numericlly equal to key plus one
      //limit: 1,                 // Here we limit to 1 to get only row
      reverse: false,             // Optional: Get reversed data
      show_payer: false,          // Optional: Show ram payer,
    })

    return rowsArr.rows.map(row => JSON.parse(row.document))

  }



  //////////////////////////////////////////////////////////
  // Erase Documents
  //////////////////////////////////////////////////////////

  static async eraseAllPsibase() {

    let networkUserObj = await db.table('settings').get('application')
    let currentUserId = networkUserObj.currentUserId

    const actions = [{
      account: 'argonautvoya',
      name: 'eraseall',
      authorization: [{
        actor: currentUserId,
        permission: 'active'
      }],
      data: {
        username: currentUserId
      }
    }]
    return takeAction(actions)
  }

  static async erasePsibase(key) {

    let networkUserObj = await db.table('settings').get('application')
    let currentUserId = networkUserObj.currentUserId

    const actions = [{
      account: 'argonautvoya',
      name: 'erase',
      authorization: [{
        actor: currentUserId,
        permission: 'active'
      }],
      data: {
        username: currentUserId,
        key: key
      }
    }]
    return takeAction(actions)
  }




  //////////////////////////////////////////////////////////
  // Add Accounts
  //////////////////////////////////////////////////////////



  static async addTestAccounts($message) {

    // Prime Psibase with test accounts from the cache
    // Acounts must be created in the right order because psibase does a referential integrity check
    // We do each of the accounts in its own transaction in case the account aready exists
    // I get get_block_info 404 (Not Found) when I run this locally but it doesnt seem to matter


    const addAccount = async actionArr => {
      // buyrambytes and delegatebw only needed when the psibase system contract is running
      // actionArr.splice(1, 2)
      try {
        await takeAction(actionArr)
        console.info('Added', actionArr[0].data.name)
        $message({ message: actionArr[0].data.name + ' Added', type: "success" });
      } catch (err) {
        if (err.includes("as that name is already taken")) $message({ message: actionArr[0].data.name + ' Already added', type: "success" });
        else {
          console.error(err)
          $message({ message: err.reason.message, type: "error" });
        }
      }
    }

    // START HERE
    let networkUserObj = await db.table('settings').get("application")
    let currentUserId = networkUserObj.currentUserId

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

    //addAccount(accountActionsArr[13])
    console.log('accounts added')

  }



  //////////////////////////////////////////////////////////
  // Save Cancel
  //////////////////////////////////////////////////////////

  static async saveChanges() {

    const updatedObjectsArr = await db.updatedObjects.orderBy('timestamp').toArray()

    for await (const updatedObj of updatedObjectsArr) {
      if (updatedObj.action === 'created' || updatedObj.action === 'updated') {
        const document = await db.state.get(updatedObj.key)
        await this.upsertDocument(document)
        await db.updatedObjects.delete(updatedObj.key)
      }
      else if (updatedObj.action === 'deleted') {
        await this.erasePsibase(updatedObj.key)
        await db.updatedObjects.delete(updatedObj.key)
      }
    }

  }

  static async cancelChanges() {

    const updatedObjectsArr = await db.updatedObjects.orderBy('timestamp').toArray()

    for await (const updatedObj of updatedObjectsArr) {
      // Set causedBy in UpdatedObects so that The Dexie observer knows we caused this update, not the user
      // The observer will respond by deleteing this record rather then putting a new one
      await db.updatedObjects.update(updatedObj.key, { causedBy: 'cancelChanges' })
      const document = await this.getDocumentByKey(updatedObj.key)
      // Psibase is leading. Do whatever it says.
      if (document) await db.state.put(document)
      else await db.state.delete(updatedObj.key)
    }

  }




  //////////////////////////////////////////////////////////
  // Update active permission
  //////////////////////////////////////////////////////////
  static async addActivePermission(actor) {

    //TODO must retrieve account to merge existing

    let networkUserObj = await db.table('settings').get('application')
    let currentUserId = networkUserObj.currentUserId

    const actions = [{
      account: 'psibaseio',
      name: 'updateauth',
      authorization: [{
        actor: currentUserId,
        permission: 'active',
      }],
      data: {
        account: currentUserId,
        permission: 'active',
        parent: 'owner',
        auth: {
          threshold: 1,
          accounts: [{
            permission: {
              actor: actor,
              permission: 'active'
            },
            weight: 1
          }],
          keys: [],
          waits: []
        }
      },
    }]

    const result = await takeAction(actions)
    //console.log(result)


    const printTraces = result => {
      console.log(result.console)
      if (result.inline_traces.length) printTraces(result.inline_traces[0])
    }


    printTraces(result.processed.action_traces[0])


    return result

  }





  //////////////////////////////////////////////////////////
  // Transfer
  //////////////////////////////////////////////////////////
  static async transfer(to) {


    let networkUserObj = await db.table('settings').get('application')
    let currentUserId = networkUserObj.currentUserId

    const actions = [{
      account: 'psibaseio.token',
      name: 'transfer',
      authorization: [{
        actor: currentUserId,
        permission: 'active',
      }],
      data: {
        from: currentUserId,
        to: to,
        quantity: '8.0000 EOS',
        memo: 'some memo'
      }
    }]

    const result = await takeAction(actions)
    //console.log(result)


    const printTraces = result => {
      console.log(result.console)
      if (result.inline_traces.length) printTraces(result.inline_traces[0])
    }


    printTraces(result.processed.action_traces[0])


    return result

  }




  //////////////////////////////////////////////////////////
  // Buyrambytes Doesn't work
  //////////////////////////////////////////////////////////
  static async buyrambytes() {


    let networkUserObj = await db.table('settings').get('application')
    let currentUserId = networkUserObj.currentUserId

    const actions = [{
      "account": "psibaseio",
      "name": "buyrambytes",
      "authorization": [
        {
          "actor": currentUserId,
          "permission": "active"
        }
      ],
      "data": {
        "payer": currentUserId,
        "receiver": "argonautvoya",
        "bytes": 500000
      }
    }]

    const result = await takeAction(actions)
    //console.log(result)


    const printTraces = result => {
      console.log(result.console)
      if (result.inline_traces.length) printTraces(result.inline_traces[0])
    }


    printTraces(result.processed.action_traces[0])


    return result

  }



  //////////////////////////////////////////////////////////
  // Test
  //////////////////////////////////////////////////////////
  static async testPsibase() {


    let networkUserObj = await db.table('settings').get('application')
    let currentUserId = networkUserObj.currentUserId


    const actions = [{
      account: 'psibaseio',
      name: 'updateauth',
      authorization: [{
        actor: 'argonautvoya',
        permission: 'active',
      }],
      data: {
        account: 'argonautvoya',
        permission: 'active',
        parent: 'owner',
        auth: {
          threshold: 1,
          accounts: [],
          "keys": [
            {
              "key": "EOS7iDk4oo8MKkhMPAtNf2ut6mYrHJor2qQ6eK5trcxBjJXmv6Mwe",
              "weight": 1
            }
          ],
          waits: []
        }
      },
    }]

    const printTraces = result => {
      console.log(result.console)
      if (result.inline_traces.length) printTraces(result.inline_traces[0])
    }

    //const document = await db.state.get('ikjyhlqewxs3')
    const result = await takeAction(actions)

    //const result = await this.upsertDocument(testObject)

    console.log(result)
    printTraces(result.processed.action_traces[0])


    return result

  }
}

export default PsibaseApiService