#![allow(non_snake_case)]
#![allow(dead_code, unused_variables)]
use crate::service::{ArgoqueryPath, ClassRow, ClassesTable};
//use jsonschema::{Draft, JSONSchema};
//use jsonschema::{CustomKeywordDefinition, ErrorIterator, JSONSchema, paths::JSONPointer};
use psibase::Table;
use psibase::*;
use serde_json::Map;
use serde_json::Value;

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
        // String to json Value
        let res = serde_json::from_str(&row.content);
        check(
            res.is_ok(),
            &format!("\nUnable to parse class:\n{:#?}", res),
        );
        let class_val: Value = res.unwrap();

        let merged_properties = get_merged_ancestors(&class_val);
        println!("merged_properties: {:#?}", merged_properties.as_str());
        //row.argoquery_paths = get_argoquery_paths(&merged_properties);
        get_validator(&merged_properties);

        // Write class row
        let res = ClassesTable::new().put(&row);
        check(
            res.is_ok(),
            &format!("\nUnable to put class row: {:#?}\nrow: {:#?}", res, row),
        );
    }
}

fn get_merged_ancestors(class_val: &Value) -> Value {
    // Get the key as account number
    let key = accountnumber_from_val(class_val, "key");
    // If we are at the root: universe, return a clone of our properties
    if key == AccountNumber::from_exact("universe").unwrap() {
        return class_val["properties"].clone();
    }
    // else

    // Get our class properties
    let res = class_val["properties"].as_object();
    check(
        res.is_some(),
        &format!("\nUnable to parse class properties:\n{:#?}", res),
    );
    let our_properties_obj = res.unwrap();

    // Get the superClassId as account number
    let super_class_id = accountnumber_from_val(class_val, "superClassId");

    // Get the super class by superClassId
    let row_opt = ClassesTable::new().get_index_pk().get(&super_class_id);
    check(
        row_opt.is_some(),
        &format!("\nUnable to get class: {}", key,),
    );
    let row = row_opt.unwrap();

    // Content to json Value
    let res = serde_json::from_str(&row.content);
    check(
        res.is_ok(),
        &format!("\nUnable to parse payload:\n{:#?}", res),
    );
    let superclass_val: Value = res.unwrap();

    // Get super class properties
    let mut super_properties_val = get_merged_ancestors(&superclass_val);
    let res = super_properties_val.as_object_mut();
    check(
        res.is_some(),
        &format!("\nUnable to parse superclass properties:\n{:#?}", res),
    );
    let super_properties_obj: &mut Map<String, Value> = res.unwrap();

    //super_properties_obj.append(our_properties_val);

    for (key, value) in our_properties_obj.into_iter() {
        super_properties_obj.insert(key.to_string(), value.clone());
    }

    super_properties_val
}

fn get_argoquery_paths(object_val: &Value) -> Vec<ArgoqueryPath> {
    // This might solve our problems
    // feat: Custom keyword validation
    // https://github.com/Stranger6667/jsonschema-rs/pull/394

    // Get the properties (required)
    let res = object_val["properties"].as_object();
    check(
        res.is_some(),
        &format!("\nUnable to parse properties\nGot:: {:#?}", object_val),
    );
    let properties_val = res.unwrap();

    let mut argoquery_paths = vec![];
    // For each property
    for (prop_name, property_val) in properties_val {
        // Get the type (required)
        let res = &property_val["type"].as_str();
        check(
            res.is_some(),
            &format!("\nUnable to parse type\nGot: {:#?}", properties_val),
        );
        let type_str = res.unwrap();

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
            check(
                res.is_some(),
                &format!("\nUnable to parse type\nGot: {:#?}", items_val),
            );
            let type_str = res.unwrap();

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
        // An object that possibly contains properties that conatain foreign keys
        else if type_str == "object" {
            let res_argoquery_paths = get_argoquery_paths(property_val);
            for mut argoPath in res_argoquery_paths.into_iter() {
                argoPath.path.insert(0, prop_name.to_owned());
                argoquery_paths.push(argoPath);
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
