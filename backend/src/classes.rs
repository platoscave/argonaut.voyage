#![allow(non_snake_case)]
use jsonschema::{Draft, JSONSchema};
use serde_json::Value;

pub fn upsert_classes(classes_arr: Value) {
    let classes = classes_arr
        .as_array()
        .expect("Expected an array of class objects");
    for schema_json in classes {
        upsert_class(schema_json);
    }
}

pub fn upsert_class(schema_json: &Value) {
    let key = schema_json["key"].as_str().expect("Unable to parse key");

    // validate superclassId, except for root class
    if key != "gzthjuyjca4s" {
        let superclassId = schema_json["superclassId"]
            .as_str()
            .expect("Unable to parse superclassId");
        // get superclassId
    }

    // validate assocs, array of assocs
    for (_, value) in schema_json["properties"]
        .as_object()
        .expect("Unable to parse property")
    {
        if let Some(classId) = value["argoQuery"]["where"]["classId"].as_str() {
            println!("Matched {:?}!", classId);
            // lookup classid
        }
        if let Some(classId) = value["items"]["argoQuery"]["where"]["classId"].as_str() {
            println!("Matched {:?}!", classId);
            // lookup classid
        }
    }

    // write json

    generate_validators(schema_json)
}

pub fn generate_validators(schema_json: &Value) {
    // get class json
    //merge_ancestor_classes(key);

    // compile validator
    let compiled_schema = JSONSchema::options()
        .with_draft(Draft::Draft7)
        .compile(&schema_json)
        .expect("A valid schema_json");

    // store validator
    // get child_classes
    // forEach of the child_classes
    //     generate_validators(key)
}

pub fn merge_ancestor_classes(key: &str) {
    //
}

pub fn check_classmodel(key: &str) {
    // look for orphan classes (look out for loops)
}

pub fn remove_all_classes() {
    //
}

pub fn remove_class(key: &str) {
    //
}
