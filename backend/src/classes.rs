#![allow(non_snake_case)]
#![allow(dead_code, unused_variables)]
use crate::service::{ArgoqueryPath, ClassRow, ClassesTable};
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

    // Translate key to AccountNumber
    let res = AccountNumber::from_exact(&key_str);
    check(
        res.is_ok(),
        &format!("\nInvalid account name: {:#?}\nkey: {}", res, key_str),
    );
    let key = res.unwrap();

    // Get superclassId as account number
    let superclass_id_str = schema_val["superclassId"].as_str().unwrap_or_default();
    let res = AccountNumber::from_exact(&superclass_id_str);
    check(
        res.is_ok(),
        &format!(
            "\nInvalid account name: {:#?}\nsuperclass_id: {}\nkey: {}",
            res, superclass_id_str, key_str
        ),
    );
    let superclass_id = res.unwrap();

    // Validate superclassId. Exception: root class
    // if key != AccountNumber::from_exact("universe").unwrap() {
    //     let row_opt = ClassesTable::new().get_index_pk().get(&superclass_id);
    //     check(
    //         row_opt.is_some(),
    //         &format!(
    //             "\nUnable to get superclassId: {}.\nkey: {}",
    //             superclass_id, key
    //         ),
    //     );
    // }

    let argoquery_paths = validate_schema_object(&schema_val);
    //println!("superclass_id number is {}", superclass_id);
    //let argoquery_paths = vec![];
    // Write json
    let new_row = ClassRow {
        key,
        superclass_id,
        content: schema_val.to_string(),
        argoquery_paths: argoquery_paths.as_ref(),
    };
    let res = ClassesTable::new().put(&new_row);
    check(
        res.is_ok(),
        &format!("\nUnable to put class row: {:#?}\nkey: {}", res, key),
    );
}

// fn get_validator(schema_val: &Value) -> JSONSchema {
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
// }

fn get_merged_ancestors(object_val: &Value) -> &Value {
    object_val
}

pub fn validate_argoqueries() {
    let idx = ClassesTable::new().get_index_pk();
    for row in idx.iter() {
        // String to json Value
        let res = serde_json::from_str(&row.content);
        check(
            res.is_ok(),
            &format!("\nUnable to parse class:\n{:#?}", res),
        );
        let object_val: Value = res.unwrap();
        //let mut argoPaths: ArgoPaths = ArgoPaths { path: (), class_id: () };

        let argoquery_paths = validate_schema_object(&object_val);
    }
}

fn validate_schema_object(object_val: &Value) -> &mut Vec<ArgoqueryPath> {
    let mut argoquery_paths = Vec::new();

    // Get the properties (required)
    let res = object_val["properties"].as_object();
    check(
        res.is_some(),
        &format!("\nUnable to parse properties\nGot:: {:#?}", object_val),
    );
    let properties_val = res.unwrap();

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
            let res = validate_argoquery(property_val);
            if let Some(class_id) = res {
                let argoPath = ArgoqueryPath {
                    path: vec![prop_name.to_owned()],
                    class_id,
                };
                argoquery_paths.push(argoPath);
            }
        }
        // // Possibly an array of foreign keys
        // else if type_str == "array" {
        //     let items_val = &property_val["items"];

        //     //let items_val = items_opt.unwrap();
        //     // Get the items type
        //     let res = items_val["type"].as_str();
        //     check(
        //         res.is_some(),
        //         &format!("\nUnable to parse type\nGot: {:#?}", items_val),
        //     );
        //     let type_str = res.unwrap();

        //     // Possibly a foreign key
        //     if type_str == "string" {
        //         validate_argoquery(&items_val);
        //     }
        //     // An object that possibly contains properties that conatain foreign keys
        //     else if type_str == "object" {
        //         validate_schema_object(&items_val);
        //     }
        // }
        // An object that possibly contains properties that conatain foreign keys
        else if type_str == "object" {
            let res_argoquery_paths = validate_schema_object(property_val);
            let paths_iter = res_argoquery_paths.iter();
            for path_class in paths_iter {
                path_class.path.insert(0, prop_name.to_owned());
            }
            //argpquery_paths.path.
        }
    }
    &mut argoquery_paths
}

// Take the property, see if it has an argoQuey, validate it, lookup classid
fn validate_argoquery(property_val: &Value) -> Option<AccountNumber> {
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
            let row_opt = ClassesTable::new().get_index_pk().get(&class_id);
            check(
                row_opt.is_some(),
                &format!("\nUnable to get classId in argoquery: {}", class_id),
            );
            return Some(class_id);
        }
        // } else if selector_str == "Where Clause" {
        // } else if selector_str == "Context Object" {
    }
    None
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
