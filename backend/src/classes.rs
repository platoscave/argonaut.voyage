#![allow(non_snake_case)]
#![allow(dead_code, unused_variables)]
use crate::service::{ClassRow, ClassesTable};
//use jsonschema::{Draft, JSONSchema};
use psibase::Table;
use psibase::{AccountNumber, *};
use serde_json::Value;

pub fn upsert_class(schema_val: &Value) {
    // Get key
    let key_str = schema_val["key"].as_str().unwrap();
    let key: AccountNumber = AccountNumber::from_exact(key_str).unwrap();
    println!("Key is {}", key_str);

    // Validate superclassId
    let mut superclass_id: AccountNumber = AccountNumber::from(0);
    if key_str != "spiderman" {
        let superclass_id_str = schema_val["superclassId"].as_str().expect("Unable to parse superclassId");
        superclass_id = AccountNumber::from_exact(superclass_id_str).unwrap();
        // lookup classId
    }

    println!("superclass_id number is {}", superclass_id);

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
    let new_record = ClassRow {
        key,
        superclass_id,
        content: schema_val.to_string(),
    };
    ClassesTable::new().put(&new_record).unwrap();
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
