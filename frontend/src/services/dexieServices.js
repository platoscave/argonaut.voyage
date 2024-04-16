// db.js
import Dexie from 'dexie';
import 'dexie-observable'; // Not rxjs observable. This is used to monitor changes.

Dexie.debug = true
export const db = new Dexie('argonautdb');


db.version(1).stores({
  state: 'key, classId, superClassId, ownerId, [classId+ownerId]', // Primary key and indexed props
  updatedObjects: 'key, timestamp',
  settings: 'pageId'
});

// Add create hook. Generate random key 
db.table('state').hook("creating", function (primKey, obj, transaction) {
  // Return random key
  const characters = "abcdefghijklmnopqrstuvwxyz12345";
  let randomKey = "";
  for (let i = 0; i < 12; i++) {
    randomKey += characters.charAt(
      Math.floor(Math.random() * characters.length)
    );
  }
  return randomKey
})

// Add change hook. 
// Keep track of changes so we can sync all at once
db.on('changes', function (changes) {
  changes.forEach(async function (change) {
    if (change.table === "state") {
      const found = await db.table('updatedObjects').get(change.key)
      // If causedBy flag is set, this updated is the result of cancelChanges, not the user
      // We just delete the record
      if (found && found.causedBy && found.causedBy === 'cancelChanges') db.table('updatedObjects').delete(change.key)
      else {
        switch (change.type) {
          case 1: // CREATED
            db.table('updatedObjects').add({ key: change.key, timestamp: Date.now(), action: 'created' })
            break;
          case 2: // UPDATED
            console.log('change.key', change.key)
            if (!found) db.table('updatedObjects').put({ key: change.key, timestamp: Date.now(), action: 'updated' })
            break;
          case 3: // DELETED
            if (found && found.action === 'created') db.table('updatedObjects').delete(change.key)
            else db.table('updatedObjects').put({ key: change.key, timestamp: Date.now(), action: 'deleted' })
            break;
        }
      }
    }
  });
});


db.reloadFromStatic = async () => {
  const response = await fetch("argonautdb.json");
  const argonautData = await response.json();
  await db.table('state').clear();
  await db.table('updatedObjects').clear();
  await db.table('state').bulkPut(argonautData);
};
