#![allow(non_snake_case)]
#![allow(dead_code, unused_variables)]
use crate::service::{ ObjectRow, ObjectsTable};
use crate::utils::*;
use psibase::Table;
use psibase::check;
use serde_json::Value;

pub fn upsert_object(object_val: &Value) {
    // get the key as account number
    let key = accountnumber_from_value(object_val, "key");

    // get the classId as account number
    let class_id = accountnumber_from_value(object_val, "classId");

    // validate classId
    let class_row = get_class_row_by_key(&class_id);

    // println!("class_id number is {}", class_id);

    // Validate assocs, array of assocs

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
