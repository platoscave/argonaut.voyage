#![allow(non_snake_case)]
#![allow(dead_code, unused_variables)]
use crate::service::{ObjectRow, ObjectsTable};
use psibase::Table;
use psibase::{AccountNumber, *};

//use AccountNumber::FromStr;
use serde_json::Value;

pub fn upsert_object(object_val: &Value) {
    // Get key
    let key_str = object_val["key"].as_str().unwrap();
    let key: AccountNumber = AccountNumber::from_exact(key_str).unwrap();
    //println!("Key is {}", key_str);

    // Validate classId
    let class_id_str = object_val["classId"].as_str().unwrap();
    let class_id: AccountNumber = AccountNumber::from_exact(class_id_str).unwrap();
    // lookup classId

    println!("class_id number is {}", class_id);

    //Validate assocs, array of assocs

    // for (key, value) in object_val.as_object().expect("Unable to parse object") {
    //     let last_two = {
    //         let split_pos = key.char_indices().nth_back(1).unwrap().0;
    //         &key[split_pos..]
    //     };
    //     println!("Id {:?}", last_two);
    //     if last_two == "Id" {
    //         if let Some(object_id) = value.as_str().expect("Unable to parse object_id") {
    //             println!("Matched {:?}!", object_id);
    //             // lookup object_id
    //         }
    //     }
    // }

    // Get the compiled validator by classId

    // Validate object by validator

    // Write json
    let objects_table = ObjectsTable::new();
    let new_record = ObjectRow {
        key,
        class_id,
        content: object_val.to_string(),
    };
    ObjectsTable::new().put(&new_record).unwrap();
}

pub fn check_objectmodel(objectId: &str) {
    // look for orphan objects (look out for loops)
}

pub fn erase_all_objects() {
    let objects_table = ObjectsTable::new();
    //objects_table
    //objects_table.erase(&key);
}
