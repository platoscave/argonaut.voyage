#![allow(non_snake_case)]
#![allow(dead_code, unused_variables)]
use crate::service::{ClassesTable, ObjectRow, ObjectsTable};
use psibase::Table;
use psibase::{AccountNumber, *};

//use AccountNumber::FromStr;
use serde_json::Value;

pub fn upsert_object(object_val: &Value) {
    // Get the key
    let res = object_val["key"].as_str();
    check(
        res.is_some(),
        &format!("\nUnable to parse key\nGot: {:#?}", object_val),
    );
    let key_str = res.unwrap();
    let res = AccountNumber::from_exact(&key_str);
    check(
        res.is_ok(),
        &format!("\nInvalid account name: {:#?}\nkey: {}", res, key_str),
    );
    let key = res.unwrap();

    // Get classId
    let res = object_val["classId"].as_str();
    check(
        res.is_some(),
        &format!("\nUnable to parse classId.\nGot: {:#?}", object_val),
    );
    let class_id_str = res.unwrap();
    let res = AccountNumber::from_exact(&class_id_str);
    check(
        res.is_ok(),
        &format!(
            "\nInvalid account name: {:#?}\nclass_id_str: {}\nkey: {}",
            res, class_id_str, key_str
        ),
    );
    let class_id = res.unwrap();
    // Validate classId
    let row_opt = ClassesTable::new().get_index_pk().get(&class_id);
    check(
        row_opt.is_some(),
        &format!("\nUnable to get classId: {}.\nkey: {}", class_id, key),
    );

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
    let new_row = ObjectRow {
        key,
        class_id,
        content: object_val.to_string(),
    };
    let res = ObjectsTable::new().put(&new_row);
    check(
        res.is_ok(),
        &format!("\nUnable to put object row: {:#?}\nkey: {}", res, key),
    );
}

pub fn check_objectmodel(objectId: &str) {
    // look for orphan objects (look out for loops)
}

pub fn erase_all_objects() {
    let objects_table = ObjectsTable::new();
    let idx = objects_table.get_index_pk();
    for row in idx.iter() {
        objects_table.erase(&row.key);
    }
}
