import { db } from "~/services/dexieServices";

interface IObject {
    [key: string]: string | object;
    properties: {
        [key: string]: string;
    }
}

// Updates the target object with corresponding properties from the source object, recusivly
// We write our own deepMerge (instead of using lodash) because we have to be able to reproduce it in C++, see below
const deepMerge = (targetObj: IObject, sourceObj: IObject) => {

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
                deepMerge(targetObj[propName], sourceObj[propName])
            }
            else targetObj[propName] = sourceProp
        }
        else targetObj[propName] = sourceProp

    })
}

// Merge class with all of its ancestors, recusivly
export const getClassSchema = async (_id: string) => {

    const classObj:IObject = await db.state.get(_id)

    if (classObj.superClassId) {

        const parentClassObj:IObject = await getClassSchema(classObj.superClassId)
        // Ovwewrite parentClassObj with this classObj and return the result
        deepMerge(parentClassObj, classObj)
        return parentClassObj

    }
    else return classObj

}

// Get the view, then get the merged ancestors of the baseClassId it points to.
// Finally merge the view with the merged ancestors
const getMaterializedView = async (viewId: string) => {

    const smartMerge = (viewObj:IObject, classObj:IObject) => {

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
                        deepMerge(viewObj.properties[propName], classObj.properties[propName])
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

        if (viewObj.definitions && classObj.definitions) deepMerge(viewObj.definitions, classObj.definitions)
        else if (classObj.definitions) viewObj.definitions = classObj.definitions
    }


    // START HERE
    // Get the view
    const viewObj = await db.state.get(viewId)

    // No baseClassId provided, simply return viewObj
    if (!viewObj.baseClassId) return viewObj

    const mergedAncestorProperties = await getClassSchema(viewObj.baseClassId)

    smartMerge(viewObj, mergedAncestorProperties)

    return viewObj
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