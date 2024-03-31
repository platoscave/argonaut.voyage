#![allow(non_snake_case)]
#![allow(dead_code, unused_variables)]
use crate::service::{ClassRow, ClassesTable};
//use jsonschema::{Draft, JSONSchema};
use psibase::Table;
use psibase::*;
use serde_json::Value;

pub fn upsert_class(schema_val: &Value) {
    // Get the key
    let res = schema_val["key"].as_str();
    check(
        res.is_some(),
        &format!("\nUnable to parse key\nGot: {:#?}", schema_val),
    );
    let key_str = res.unwrap();
    let res = AccountNumber::from_exact(&key_str);
    check(
        res.is_ok(),
        &format!("\nInvalid account name: {:#?}\nkey: {}", res, key_str),
    );
    let key = res.unwrap();

    // Get superclassId
    let superclass_id_str = schema_val["superclassId"].as_str().unwrap_or_default();
    let res = AccountNumber::from_exact(&superclass_id_str);
    check(
        res.is_ok(),
        &format!("\nInvalid account name: {:#?}\nsuperclass_id: {}\nkey: {}", res, superclass_id_str, key_str),
    );
    let superclass_id = res.unwrap();
    // Validate superclassId. Exception: root class
    if key != AccountNumber::from_exact("spiderman").unwrap() {
        let row_opt = ClassesTable::new().get_index_pk().get(&superclass_id);
        check(
            row_opt.is_some(),
            &format!(
                "\nUnable to get superclassId: {}.\nkey: {}",
                superclass_id, key
            ),
        );
    }

    //println!("superclass_id number is {}", superclass_id);

    // validate assocs, array of assocs
    // for (_, value) in schema_val["properties"]
    //     .as_object()
    //     .expect("Unable to parse property")
    // {
    //     if let Some(classId) = value["argoQuery"]["where"]["classId"].as_str() {
    //         println!("Matched {:?}!", classId);
    //         // lookup classid
    //     }
    //     if let Some(classId) = value["items"]["argoQuery"]["where"]["classId"].as_str() {
    //         println!("Matched {:?}!", classId);
    //         // lookup classid
    //     }
    // }

    // write json

    //let validator = get_validator(schema_val);
    get_argoquery_paths(schema_val);

    // Write json
    let new_row = ClassRow {
        key,
        superclass_id,
        content: schema_val.to_string(),
    };
    let res = ClassesTable::new().put(&new_row);
    check(
        res.is_ok(),
        &format!("\nUnable to put class row: {:#?}\nkey: {}", res, key),
    );
}

//fn get_validator(schema_val: &Value) -> JSONSchema {
// get class json
//get_merged_ancestors(key);

// compile validator
// JSONSchema::options()
//     .with_draft(Draft::Draft7)
//     .compile(&schema_val)
//     .expect("A valid schema_val")

// store validator
// get child_classes
// forEach of the child_classes
//     generate_validators(key)
//}

fn get_argoquery_paths(schema_val: &Value) {}

fn get_merged_ancestors(key: &str) {
    //
}

pub fn check_classmodel(key: &str) {
    // look for orphan classes (look out for loops)
}

pub fn erase_all_classes() {
    //
    //ClassesTable::new().get_index(idx)
    //for i in ClassesTable::new(). {
    //println!("> {}", i);
    //}
}
