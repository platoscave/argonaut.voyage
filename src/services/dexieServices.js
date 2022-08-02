// db.js
import Dexie from 'dexie';
import { liveQuery } from "dexie";
import { useSubscription } from '@vueuse/rxjs'
//import { defer, of, from } from 'rxjs';
//import { map, switchMap } from 'rxjs/operators'
import jp from "jsonpath"
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




export class argoQuery {

  // Updates the target object with corresponding properties from the source object, recusivly
  // We write our own deepMerge (instead of using lodash) because we have to be able to reproduce it in C++, see below
  static deepMerge(targetObj, sourceObj) {

    Object.keys(sourceObj).forEach(propName => {

      const targetProp = targetObj[propName]
      const sourceProp = sourceObj[propName]
      // TODO test if the types are the same, else throw error ?
      if (targetProp) {
        if (Array.isArray(sourceProp)) {
          // TODO make unique?
          // TODO deepMerge objects?
          targetObj[propName] = targetProp.concat(sourceProp)
        }
        else if (typeof sourceProp === "object") {
          this.deepMerge(targetObj[propName], sourceObj[propName])
        }
        else targetObj[propName] = sourceProp
      }
      else targetObj[propName] = sourceProp

    })
  }

  // Merge class with all of its ancestors, recusivly
  static async getMergedAncestorProperties(_id) {

    const classObj = await db.state.get(_id)

    if (classObj.superClassId) {

      const parentClassObj = await this.getMergedAncestorProperties(classObj.superClassId)
      // Ovwewrite parentClassObj with this classObj and return the result
      this.deepMerge(parentClassObj, classObj)
      return parentClassObj

    }
    else return classObj

  }

  // Get the view, then get the merged ancestors of the baseClassId it points to.
  // Finally merge the view with the merged ancestors
  static async getMaterializedView(viewId) {

    const smartMerge = (viewObj, classObj) => {

      if (viewObj.properties) {
        // The the order and presence of viewObj properties is leading
        Object.keys(viewObj.properties).forEach(propName => {
          const viewProp = viewObj.properties[propName]
          const classProp = classObj.properties[propName]
          // TODO test if the types are the same, else throw error ?
          if (classProp) {
            if (Array.isArray(viewProp)) {
              // TODO make unique?
              // TODO deepMerge objects?
              viewObj.properties[propName] = viewProp.concat(classProp)
            }
            else if (typeof viewProp === "object") {
              // TODO view may want to overwrite certain properties eg title
              this.deepMerge(viewObj.properties[propName], classObj.properties[propName])
            }
            else {
              // TODO view cannot make things longer or shorter, earlier or later than allowed by merged ancesters
              //viewObj.properties[propName] = classProp
            }
          }
        })
      }

      // TODO Make sure unique?
      if (viewObj.requrired && classObj.requrired) viewObj.required = viewObj.required.concat(classObj.requrired)
      else if (classObj.requrired) viewObj.required = classObj.requrired

      if (viewObj.definitions && classObj.definitions) this.deepMerge(viewObj.definitions, classObj.definitions)
      else if (classObj.definitions) viewObj.definitions = classObj.definitions
    }


    // START HERE
    // Get the view
    const viewObj = await db.state.get(viewId)

    // No baseClassId provided, simply return viewObj
    if (!viewObj.baseClassId) return viewObj

    const mergedAncestorProperties = await this.getMergedAncestorProperties(viewObj.baseClassId)

    smartMerge(viewObj, mergedAncestorProperties)

    return viewObj
  }

}

/*  example of C++ merge: https://stackoverflow.com/questions/40013355/how-to-merge-two-json-file-using-rapidjson

void mergeObjects(rapidjson::Value &dstObject, rapidjson::Value &srcObject, rapidjson::Document::AllocatorType &allocator)
{
  for (auto srcIt = srcObject.MemberBegin(); srcIt != srcObject.MemberEnd(); ++srcIt)
  {
      auto dstIt = dstObject.FindMember(srcIt->name);
      if (dstIt != dstObject.MemberEnd())
      {
          assert(srcIt->value.GetType() == dstIt->value.GetType());
          if (srcIt->value.IsArray())
          {
              for (auto arrayIt = srcIt->value.Begin(); arrayIt != srcIt->value.End(); ++arrayIt)
              {
                  dstIt->value.PushBack(*arrayIt, allocator);
              }
          }
          else if (srcIt->value.IsObject())
          {
              mergeObjects(dstIt->value, srcIt->value, allocator);
          }
          else
          {
              dstIt->value = srcIt->value;
          }
      }
      else
      {
          dstObject.AddMember(srcIt->name, srcIt->value, allocator);
      }
  }
} */