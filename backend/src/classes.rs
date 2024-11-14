use crate::service::{ClassRow, ClassesTable};
use crate::utils::*;
use psibase::{check, AccountNumber, Table};
use serde_json::Value;

pub fn upsert_class(class_val: &Value) {
    // get the key as account number
    let key = accountnumber_from_value(class_val, "key");

    let superclass_id = AccountNumber::from(0); // default superclass_id is 0

    let mut merged_ancestors = class_val.clone(); // default is our Value

    // if not at the root
    if key != AccountNumber::from_exact("universe").unwrap() {
        add_merged_ancestors(&mut merged_ancestors);
    }

    // Write class row
    let row = ClassRow {
        key,
        superclass_id,
        class_str: class_val.to_string(),
        merged_ancestors_str: merged_ancestors.to_string(),
    };
    let res = ClassesTable::new().put(&row);
    check(
        res.is_ok(),
        &format!("\nUnable to put class row: {:#?}\nrow: {:#?}", res, row),
    );
}

fn add_merged_ancestors(class_val: &mut Value) {
    // get superClassId as account number
    let superclass_id = accountnumber_from_value(class_val, "superClassId");
    // get super class
    let super_class_row = get_class_row_by_key(&superclass_id);

    // merged_ancestors_str to json Value
    let res = serde_json::from_str(&super_class_row.merged_ancestors_str);
    check(
        res.is_ok(),
        &format!(
            "\nUnable to parse merged_ancestors: {:#?}\n{:#?}",
            res, super_class_row.merged_ancestors_str
        ),
    );
    let super_class_val: Value = res.unwrap();

    let our_class_obj = class_val.as_object_mut().unwrap();

    //////////////////////// Merge class properties object
    {
        // Get superclass properties obj
        let res = super_class_val["properties"].as_object();
        check(
            res.is_some(),
            &format!("\nSuperclass properties not found:\n{:#?}", res),
        );
        let super_prop_obj = res.unwrap();

        // Get our class properties value

        // if none exists, add a new one
        if !our_class_obj.contains_key("properties") {
            our_class_obj.insert(
                "properties".to_string(),
                Value::Object(serde_json::Map::new()),
            );
        }

        let our_prop_val: &mut serde_json::Value = our_class_obj.get_mut("properties").unwrap();
        let our_prop_obj = our_prop_val.as_object_mut().unwrap();

        //**** merge super class properties into ours ****/
        for (key, value) in super_prop_obj.into_iter() {
            our_prop_obj.insert(key.to_string(), value.clone());
        }
    }

    //////////////////////// Merge class required array
    {
        // Get superclass required obj
        let res = super_class_val["required"].as_array();
        check(
            res.is_some(),
            &format!("\nSuperclass required not found:\n{:#?}", res),
        );
        let super_req_arr = res.unwrap();

        // Get our class required value
        // if none exists, add a new one
        if !our_class_obj.contains_key("required") {
            our_class_obj.insert(
                "required".to_string(),
                Value::Array(Vec::new()),
            );
        }

        let our_req_val: &mut serde_json::Value = our_class_obj.get_mut("required").unwrap();
        let our_req_arr = our_req_val.as_array_mut().unwrap();

        //**** merge super class required into ours ****/
        for value in super_req_arr.into_iter() {
            our_req_arr.push(value.to_owned());
        }

    }

}

pub fn check_classmodel(key: &str) {
    // look for orphan classes (look out for loops)
}

pub fn erase_all_classes() {
    let objects_table = ClassesTable::new();
    let idx = objects_table.get_index_pk();
    for row in idx.iter() {
        objects_table.erase(&row.key);
    }
}
