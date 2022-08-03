// db.js
import Dexie from 'dexie';
import 'dexie-observable'; // Not rxjs observable. This is used to monitor changes.

Dexie.debug = true
export const db = new Dexie('argonautdb');
db.version(1).stores({
  state: '_id, classId, superClassId, ownerId, [classId+ownerId]', // Primary key and indexed props
  updatedObjects: '_id, timestamp',
  settings: 'pageId'
});

// Add create hook
// Generate random key. Will be ignored if one is supplied 
db.state.hook("creating", function (primKey, obj, transaction) {
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
      const found = await db.updatedObjects.get(change.key)
      // If causedBy flag is set, this updated is the result of cancelChanges, not the user
      // We just delete the record
      if (found && found.causedBy && found.causedBy === 'cancelChanges') db.updatedObjects.delete(change.key)
      else {
        switch (change.type) {
          case 1: // CREATED
            db.updatedObjects.add({ _id: change.key, timestamp: Date.now(), action: 'created' })
            break;
          case 2: // UPDATED
            console.log('change.key', change.key)
            if (!found) db.updatedObjects.put({ _id: change.key, timestamp: Date.now(), action: 'updated' })
            break;
          case 3: // DELETED
            if (found && found.action === 'created') db.updatedObjects.delete(change.key)
            else db.updatedObjects.put({ _id: change.key, timestamp: Date.now(), action: 'deleted' })
            break;
        }
      }
    }
  });
});
