use crate::service::{ObjectRow, ObjectsTable};
use crate::utils::*;
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
        //.with_keyword("argoQuery", argo_query_validator_factory);
        .build(merged_ancestors_val);
    check(
        res.is_ok(),
        &format!(
            "\nUnable to build schema: {:#?}\nMerged ancestors: \n{:#?}",
            res,
            serde_json::to_value(merged_ancestors_val).unwrap()
        ),
    );
    let validator = res.unwrap();

    let result = validator.validate(&object_val); //.basic()

    if let Err(errors) = result {
        let mut message: String = String::new();
        for error in errors {
            message += &format!(
                "\nObject invalid: {:#?}\nLocation: {:#?}",
                error, error.instance_path
            )
        }
        check(false, &message);
    }
}

pub fn erase_all_objects() {
    let objects_table = ObjectsTable::new();
    let idx = objects_table.get_index_pk();
    for row in idx.iter() {
        objects_table.erase(&row.key);
    }
}
