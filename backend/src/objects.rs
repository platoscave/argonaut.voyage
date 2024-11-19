use crate::service::{ObjectRow, ObjectsTable};
use crate::utils::*;
use crate::argoquery_validator::argo_query_validator_factory;
use jsonschema::{Draft, Validator};
use psibase::check;
use psibase::Table;
use serde_json::Value;

pub fn upsert_object(object_val: &Value) {
    // get the key as account number
    let key = accountnumber_from_value(object_val, "key");

    // get the classId as account number
    let class_id = accountnumber_from_value(object_val, "classId");

    // validate classId
    let class_row: crate::service::ClassRow = get_class_row_by_key(&class_id);

    let merged_ancestors_val: Value =
        serde_json::from_str(&class_row.merged_ancestors_str).unwrap();

    validate_object(&object_val, &merged_ancestors_val);

    // Write json
    let new_row = ObjectRow {
        key,
        class_id,
        object_str: object_val.to_string(),
    };
    let res = ObjectsTable::new().put(&new_row);
    check(
        res.is_ok(),
        &format!("\nUnable to put object row: {:#?}\nkey: {}", res, key),
    );
}

pub fn validate_object(object_val: &Value, merged_ancestors_val: &Value) {

    let res = Validator::options()
        .with_draft(Draft::Draft7)
        .with_keyword("argoQuery", argo_query_validator_factory)
        .build(merged_ancestors_val);

    if let Ok(validator) = res {
        
        let mut message: String = String::new();
        for error in validator.iter_errors(&object_val) {
            message += &format!("{:#?}", error);
        }
        check(
            message.is_empty(),
            &format!("\nInvalid object:\n{:#?}", message),
        );

    } else if let Err(error) = res {
        check(false, &format!("\nInvalid schema:\n{:#?}", error));
    }
}

pub fn erase_all_objects() {
    let objects_table = ObjectsTable::new();
    let idx = objects_table.get_index_pk();
    for row in idx.iter() {
        objects_table.erase(&row.key);
    }
}
