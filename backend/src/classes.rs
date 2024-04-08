#![allow(non_snake_case)]
#![allow(dead_code, unused_variables)]
use crate::service::{ArgoqueryPath, ClassRow, ClassesTable};
//use jsonschema::{Draft, JSONSchema};
//use jsonschema::{CustomKeywordDefinition, ErrorIterator, JSONSchema, paths::JSONPointer};
use psibase::Table;
use psibase::*;
use serde_json::Map;
use serde_json::Value;
use serde_json::Value::Null;

pub fn upsert_class(schema_val: &Value) {
    // Get the key as account number
    let key = accountnumber_from_val(schema_val, "key");

    // Get superClassId as account number
    let mut superclass_id = AccountNumber::from(0);
    if key != AccountNumber::from_exact("universe").unwrap() {
        superclass_id = accountnumber_from_val(schema_val, "superClassId");
        // Validate superClassId
        let row_opt = ClassesTable::new().get_index_pk().get(&superclass_id);
        check(
            row_opt.is_some(),
            &format!(
                "\nUnable to get superClassId: {}.\nkey: {}",
                superclass_id, key
            ),
        );
    }

    // Write class row
    let row = ClassRow {
        key,
        superclass_id,
        content: schema_val.to_string(),
        argoquery_paths: vec![],
    };
    let res = ClassesTable::new().put(&row);
    check(
        res.is_ok(),
        &format!("\nUnable to put class row: {:#?}\nrow: {:#?}", res, row),
    );
}

pub fn generate_validators() {
    let idx = ClassesTable::new().get_index_pk();
    for mut row in idx.iter() {
        // Get merged ancestors by key
        let merged_ancestors = get_merged_ancestors(row.key);
        //println!("merged_ancestors: \n{:#?}", merged_ancestors);
        row.argoquery_paths = get_argoquery_paths(&merged_ancestors);
        get_validator(&merged_ancestors);

        // Write class row
        let res = ClassesTable::new().put(&row);
        check(
            res.is_ok(),
            &format!("\nUnable to put class row: {:#?}\nrow: {:#?}", res, row),
        );
    }
}
pub fn generate_validator() {
    // Get the key as account number
    let key = AccountNumber::from_exact("resources").unwrap();
    // Get merged ancestors by key
    let merged_ancestors = get_merged_ancestors(key);
    println!("merged_ancestors: \n{:#?}", merged_ancestors);
}
fn get_merged_ancestors(class_id: AccountNumber) -> Value {
    //**** our class ****/
    // Read the class by class_id
    let row_opt = ClassesTable::new().get_index_pk().get(&class_id);
    check(
        row_opt.is_some(),
        &format!("\nUnable to get class: {}", class_id,),
    );
    let row = row_opt.unwrap();

    // Content to json Value
    let res = serde_json::from_str(&row.content);
    check(
        res.is_ok(),
        &format!("\nUnable to parse payload: {:#?}\n{:#?}", res, row.content),
    );
    let mut class_val: Value = res.unwrap();

    // If we are at the root: universe, return a clone of our properties
    if class_id == AccountNumber::from_exact("universe").unwrap() {
        return class_val;
    }
    // else

    // Get our class properties
    let res = class_val["properties"].as_object_mut();
    // If our class has no properties, return the merged super class
    if let None = res {
        // Get merged super class by calling ourselves
        return get_merged_ancestors(row.superclass_id);
    }
    // else
    let our_properties_obj: &mut Map<String, Value> = res.unwrap();

    //**** super class ****/
    // Get merged super class by calling ourselves
    let super_class_val = get_merged_ancestors(row.superclass_id);
    let res = super_class_val["properties"].as_object();
    check(
        res.is_some(),
        &format!("\nUnable to parse superclass properties:\n{:#?}", res),
    );
    let super_properties_obj = res.unwrap();

    //**** merge super class properties into ours****/
    //super_properties_obj.append(our_properties_obj);

    for (key, value) in super_properties_obj.into_iter() {
        our_properties_obj.insert(key.to_string(), value.clone());
    }

    class_val
}

fn get_argoquery_paths(object_val: &Value) -> Vec<ArgoqueryPath> {
    // This might solve our problems
    // feat: Custom keyword validation
    // https://github.com/Stranger6667/jsonschema-rs/pull/394

    // Get the properties (required)
    let res = object_val["properties"].as_object();
    if let None = res {
        return vec![];
    }
    let properties_val = res.unwrap();

    let mut argoquery_paths = vec![];
    // For each property
    for (prop_name, property_val) in properties_val {
        // Get the type (required)
        let res = property_val["type"].as_str();
        if let Some(type_str) = res {
            // Possibly a foreign key
            if type_str == "string" {
                let res = get_argoquery_class_id(property_val);
                if let Some(class_id) = res {
                    let argoPath = ArgoqueryPath {
                        path: vec![prop_name.to_owned()],
                        class_id,
                    };
                    argoquery_paths.push(argoPath);
                }
            }
            // Possibly an array of foreign keys
            else if type_str == "array" {
                let items_val = &property_val["items"];

                //let items_val = items_opt.unwrap();
                // Get the items type
                let res = items_val["type"].as_str();
                if let Some(type_str) = res {
                    // Possibly a foreign key
                    if type_str == "string" {
                        let res = get_argoquery_class_id(items_val);
                        if let Some(class_id) = res {
                            let argoPath = ArgoqueryPath {
                                path: vec![prop_name.to_owned()],
                                class_id,
                            };
                            argoquery_paths.push(argoPath);
                        }
                    }
                    // An object that possibly contains properties that conatain foreign keys
                    else if type_str == "object" {
                        let res_argoquery_paths = get_argoquery_paths(items_val);
                        for mut argoPath in res_argoquery_paths.into_iter() {
                            argoPath.path.insert(0, prop_name.to_owned());
                            argoquery_paths.push(argoPath);
                        }
                    }
                }
            }
            // An object that possibly contains properties that conatain foreign keys
            else if type_str == "object" {
                let res_argoquery_paths = get_argoquery_paths(property_val);
                for mut argoPath in res_argoquery_paths.into_iter() {
                    argoPath.path.insert(0, prop_name.to_owned());
                    argoquery_paths.push(argoPath);
                }
            }
        }
    }
    argoquery_paths
}

// Take the property, see if it has an argoQuey, validate it, lookup classid
fn get_argoquery_class_id(property_val: &Value) -> Option<AccountNumber> {
    //println!("val: {:#?}", property_val);
    // If there is an argoQuery (optional)
    if let Some(argoQuery_val) = property_val["argoQuery"].as_object() {
        // Get the selector (required)
        let res = argoQuery_val["selector"].as_str();
        check(
            res.is_some(),
            &format!("\nUnable to parse selector\nGot:: {:#?}", argoQuery_val),
        );
        let selector_str = res.unwrap();

        if selector_str == "Subclasses" {
            // Get the where obj (required)
            let res = argoQuery_val["where"].as_object();
            check(
                res.is_some(),
                &format!("\nUnable to parse where clause\nGot:: {:#?}", argoQuery_val),
            );
            let where_val = res.unwrap();

            // Get the classId (required)
            let res = where_val["classId"].as_str();
            check(
                res.is_some(),
                &format!("\nUnable to parse classId\nGot:: {:#?}", where_val),
            );
            let class_id_str = res.unwrap();

            let res = AccountNumber::from_exact(&class_id_str);
            check(
                res.is_ok(),
                &format!(
                    "\nInvalid account name: {:#?}\nclassId: {}",
                    res, class_id_str
                ),
            );
            let class_id = res.unwrap();

            //Lookup the classId
            // let row_opt = ClassesTable::new().get_index_pk().get(&class_id);
            // check(
            //     row_opt.is_some(),
            //     &format!("\nUnable to get classId in argoquery: {}", class_id),
            // );
            return Some(class_id);
        }
        // } else if selector_str == "Where Clause" {
        // } else if selector_str == "Context Object" {
    }
    None
}

fn get_validator(schema_val: &Value) {
    //     // get class json
    //     let merged_properties = get_merged_ancestors(schema_val);

    //     // Compile validator
    //     let res = JSONSchema::options()
    //         .with_draft(Draft::Draft7)
    //         .compile(&merged_properties);
    //     check(
    //         res.is_ok(),
    //         &format!(
    //             "\nUnable to compile schema: {:#?}\nGot: {:#?}",
    //             res, merged_properties
    //         ),
    //     );
    //     res.unwrap()
}

pub fn check_classmodel(key: &str) {
    // look for orphan classes (look out for loops)
}

fn accountnumber_from_val(val: &Value, prop_name: &str) -> AccountNumber {
    // Get the key str
    let res = val[prop_name].as_str();
    check(
        res.is_some(),
        &format!("\nUnable to parse {}\nGot: {:#?}", prop_name, val),
    );
    let key_str = res.unwrap();

    // Translate key to AccountNumber
    let res = AccountNumber::from_exact(&key_str);
    check(
        res.is_ok(),
        &format!("\nInvalid account name: {:#?}\nkey: {}", res, key_str),
    );
    res.unwrap()
}

pub fn erase_all_classes() {
    let objects_table = ClassesTable::new();
    let idx = objects_table.get_index_pk();
    for row in idx.iter() {
        objects_table.erase(&row.key);
    }
}
