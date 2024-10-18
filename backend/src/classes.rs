#![allow(non_snake_case)]
#![allow(dead_code, unused_variables)]
use crate::service::{ClassRow, ClassesTable};
use crate::utils::*;
use jsonschema::{Draft, Validator};
use std::fmt::Write;

//use jsonschema::{CustomKeywordDefinition, ErrorIterator, JSONSchema, paths::JSONPointer};
use psibase::{check, AccountNumber, Table};
use serde_json::{json, Map, Value};

pub fn upsert_class(schema_val: &Value) {
    // get the key as account number
    let key = accountnumber_from_value(schema_val, "key");

    let mut superclass_id = AccountNumber::from(0); // default superclass_id
                                                    // if not at the root
    if key != AccountNumber::from_exact("universe").unwrap() {
        // get superClassId as account number
        superclass_id = accountnumber_from_value(schema_val, "superClassId");
        // validate superClassId
        get_class_row_by_key(&superclass_id);
    }

    // Write class row
    let row = ClassRow {
        key,
        superclass_id,
        content: schema_val.to_string(),
        validator: vec![],
    };
    let res = ClassesTable::new().put(&row);
    check(
        res.is_ok(),
        &format!("\nUnable to put class row: {:#?}\nrow: {:#?}", res, row),
    );
}

pub fn generate_validators() {
    let idx = ClassesTable::new().get_index_pk();
    for mut row in idx.iter() {
        let validator: Validator = generate_validator(row.key);
        //println!("merged_ancestors: \n{:#?}", merged_ancestors);
        //row.validator = validator;
        //l= get_validator(&merged_ancestors);

        // Write class row
        let res = ClassesTable::new().put(&row);
        check(
            res.is_ok(),
            &format!("\nUnable to put class row: {:#?}\nrow: {:#?}", res, row),
        );
    }
}
pub fn generate_validator(class_id: AccountNumber) -> Validator {
    let merged_ancestors = get_merged_ancestors(class_id);
    //println!("merged_ancestors: \n{:#?}", merged_ancestors);

    let res = Validator::options()
        .with_draft(Draft::Draft7)
        //.with_keyword("argoQuery", argo_query_validator_factory);
        .build(&merged_ancestors);
    check(
        res.is_ok(),
        &format!(
            "\nUnable to build schema: {:#?}\nMerged ancestors: \n{:#?}",
            res,
            serde_json::to_value(merged_ancestors).unwrap()
        ),
    );
    res.unwrap()
}

fn get_merged_ancestors(class_id: AccountNumber) -> Value {
    //**** our class ****/
    // Read the class by class_id
    let row = get_class_row_by_key(&class_id);

    // Content to json Value
    let res = serde_json::from_str(&row.content);
    check(
        res.is_ok(),
        &format!("\nUnable to parse content: {:#?}\n{:#?}", res, row.content),
    );
    let mut class_val: Value = res.unwrap();

    // If we are at the root: universe, return a clone of our properties
    if class_id == AccountNumber::from_exact("universe").unwrap() {
        return class_val;
    }
    // else

    // Get our class properties (optional)
    let res = class_val["properties"].as_object_mut();
    // If our class has no properties, return the merged super class
    if let None = res {
        // Get merged super class by calling ourselves
        return get_merged_ancestors(row.superclass_id);
    }
    // else
    let our_properties_obj: &mut Map<String, Value> = res.unwrap();

    //**** super class ****/
    // Get merged super class by calling ourselves
    let super_class_val = get_merged_ancestors(row.superclass_id);

    // Get super class properties (required)
    let res = super_class_val["properties"].as_object();
    check(
        res.is_some(),
        &format!("\nUnable to parse superclass properties:\n{:#?}", res),
    );
    let super_properties_obj = res.unwrap();

    //**** merge super class properties into ours ****/
    //super_properties_obj.append(our_properties_obj);

    for (key, value) in super_properties_obj.into_iter() {
        our_properties_obj.insert(key.to_string(), value.clone());
    }

    class_val
}
/*
fn get_argoquery_paths(object_val: &Value) -> Vec<ArgoqueryPath> {
    // This might solve all our problems
    // feat: Custom keyword validation
    // https://github.com/Stranger6667/jsonschema-rs/pull/394

    // Get the properties (optional)
    let res = object_val["properties"].as_object();
    if let None = res {
        return vec![];
    }
    let properties_val = res.unwrap();

    let mut argoquery_paths = vec![];
    // For each property
    for (prop_name, property_val) in properties_val {
        // Get the type (optional)
        let res = property_val["type"].as_str();
        if let Some(type_str) = res {
            // Possibly a foreign key
            if type_str == "string" {
                let res = get_argoquery_class_id(property_val);
                if let Some(class_id) = res {
                    let argoPath = ArgoqueryPath {
                        path: vec![prop_name.to_owned()],
                        class_id,
                    };
                    argoquery_paths.push(argoPath);
                }
            }
            // Possibly an array of foreign keys
            else if type_str == "array" {
                let items_val = &property_val["items"];

                // Get the items type
                let res = items_val["type"].as_str();
                if let Some(type_str) = res {
                    // Possibly a foreign key
                    if type_str == "string" {
                        let res = get_argoquery_class_id(items_val);
                        if let Some(class_id) = res {
                            let argoPath = ArgoqueryPath {
                                path: vec![prop_name.to_owned()],
                                class_id,
                            };
                            argoquery_paths.push(argoPath);
                        }
                    }
                    // An object that possibly contains properties that conatain foreign keys
                    else if type_str == "object" {
                        let res_argoquery_paths = get_argoquery_paths(items_val);
                        for mut argoPath in res_argoquery_paths.into_iter() {
                            argoPath.path.insert(0, prop_name.to_owned());
                            argoquery_paths.push(argoPath);
                        }
                    }
                }
            }
            // An object that possibly contains properties that conatain foreign keys
            else if type_str == "object" {
                let res_argoquery_paths = get_argoquery_paths(property_val);
                for mut argoPath in res_argoquery_paths.into_iter() {
                    argoPath.path.insert(0, prop_name.to_owned());
                    argoquery_paths.push(argoPath);
                }
            }
        }
    }
    argoquery_paths
}

// Take the property, see if it has an argoQuey, validate it, lookup classid
fn get_argoquery_class_id(property_val: &Value) -> Option<AccountNumber> {
    //println!("val: {:#?}", property_val);
    // If there is an argoQuery (optional)
    if let Some(argoQuery_obj) = property_val["argoQuery"].as_object() {
        // Get the selector (required)
        let res = argoQuery_obj["selector"].as_str();
        check(
            res.is_some(),
            &format!("\nUnable to parse selector\nGot: {:#?}", argoQuery_obj),
        );
        let selector_str = res.unwrap();

        if selector_str == "Subclasses" {
            // Get the where obj (required)
            let res = argoQuery_obj["where"].as_object();
            check(
                res.is_some(),
                &format!("\nUnable to parse where clause\nGot: {:#?}", argoQuery_obj),
            );
            let where_obj = res.unwrap();

            // Get the classId (required)
            let res = where_obj["classId"].as_str();
            check(
                res.is_some(),
                &format!("\nUnable to parse classId\nGot: {:#?}", where_obj),
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

            // Validate classId
            get_class_row_by_key(&class_id);

            return Some(class_id);
        }
        // } else if selector_str == "Where Clause" {
        // } else if selector_str == "Context Object" {
    }
    None
}
*/
pub fn test_validator() {
    let schema = json!({"maxLength": 5});
    let res = Validator::options().build(&schema);

    check(
        res.is_ok(),
        &format!("\nUnable to compile schema:\nRes: {:#?}", res),
    );
    let validator = res.unwrap();
    let instance = json!("AAAAAAAAA");
    let res = validator.validate(&instance);

    if let Err(errors) = res {
        let mut message: String = "".to_string();
        for error in errors {
            write!(message, "\nError: {}", error).unwrap();
            write!(message, "\nLocation: {}", error.instance_path).unwrap();
        }
        check(false, &format!("\nInvalid json: {}", message));
    }
    println!("Valid");

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
