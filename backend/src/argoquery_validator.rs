use crate::service::{ClassesTable, ObjectsTable};
use jsonschema::{
    paths::{LazyLocation, Location},
    Keyword, ValidationError,
};
use psibase::*;
use serde_json::{Map, Value};

// Step 1: Implement the Keyword trait
struct ArgoQueryValidator {
    selector_str: String,
    class_id_ac: AccountNumber,
}

impl Keyword for ArgoQueryValidator {
    fn validate<'instance>(
        &self,
        instance: &'instance Value,
        location: &LazyLocation,
    ) -> Result<(), ValidationError<'instance>> {
        write_console(&format!("instance:\n{:#?}", instance));
        write_console(&format!("classId: {:?}", &self.class_id_ac));

        if self.class_id_ac == AccountNumber::from(0) {
            return Ok(());
        }
        // The instance must be a string
        let assoc_opt = instance.as_str();
        if let Some(assoc_str) = assoc_opt {
            // The classId must be a valid AccounNumber
            let ac_res = AccountNumber::from_exact(&assoc_str);
            if let Ok(assoc_ac) = ac_res {
                if self.selector_str == "Instance Of" {
                    // The associated object must exist
                    let object_opt = ObjectsTable::new().get_index_pk().get(&assoc_ac);
                    if let Some(object) = object_opt {
                        if is_a(object.class_id, self.class_id_ac) {
                            Ok(())
                        } else {
                            Err(ValidationError::custom(
                            Location::new(),
                            location.into(),
                            instance,
                            &format!("The associated object is not of type: {}, as required by the argoQuery",self.class_id_ac.to_string())
                        ))
                        }
                    } else {
                        Err(ValidationError::custom(
                            Location::new(),
                            location.into(),
                            instance,
                            "The associated object cannot be found",
                        ))
                    }
                } else if self.selector_str == "Subclasses" {
                    // The associated class must exist
                    let class_opt = ClassesTable::new().get_index_pk().get(&assoc_ac);
                    if let Some(class) = class_opt {
                        if is_a(class.key, self.class_id_ac) {
                            Ok(())
                        } else {
                            Err(ValidationError::custom(
                            Location::new(),
                            location.into(),
                            instance,
                            &format!("The associated class is not a subclass of: {}, as required by the argoQuery",self.class_id_ac.to_string())
                        ))
                        }
                    } else {
                        Err(ValidationError::custom(
                            Location::new(),
                            location.into(),
                            instance,
                            "The associated class cannot be found",
                        ))
                    }
                } else {
                    Ok(())
                }
            } else {
                Err(ValidationError::custom(
                    Location::new(),
                    location.into(),
                    instance,
                    "Invalid AccountNumber for association",
                ))
            }
        } else {
            Err(ValidationError::custom(
                Location::new(),
                location.into(),
                instance,
                "The association must be a string",
            ))
        }
    }

    fn is_valid(&self, instance: &Value) -> bool {
        instance.as_u64().map_or(false, |n| n % 2 == 0)
    }
}

fn is_a(class_id: AccountNumber, sought_class_id: AccountNumber) -> bool {
    //write_console(&format!("class_id: {:?}, sought_class_id: {:?}", class_id.to_string(), sought_class_id.to_string());

    if class_id == sought_class_id {
        true
    } else if class_id == AccountNumber::from_exact("universe").unwrap() {
        false
    } else {
        let row_opt = ClassesTable::new().get_index_pk().get(&class_id);
        if let Some(row) = row_opt {
            is_a(row.superclass_id, sought_class_id)
        } else {
            check(
                false,
                &format!("\nCannot find class: {:#?}", class_id.to_string()),
            );
            false
        }
    }
}

// Step 2: Create a factory function
pub fn argo_query_validator_factory<'a>(
    _parent: &'a Map<String, Value>,
    value: &'a Value,
    path: Location,
) -> Result<Box<dyn Keyword>, ValidationError<'a>> {
    write_console(&format!("argoQuery schema:\n{:#?}", value));
    /*
    Validate the schema:
    - An argoQuery must have selector
    - If selector is Insatnces Of or Subclasses, there must be a where clause
    - The index name must be classId (for now),
    - The classId must be a valid AccounNumber
    - The class must exist
    We pass the classId to ArgoQueryValidator so that it can be used for validation
    */
    // An argoQuery must have selector
    let selector_opt = value["selector"].as_str();
    if let Some(selector_str) = selector_opt {
        // If selector is Where Clause or Subclasses, there must be a where clause
        if selector_str == "Insatnces Of" || selector_str == "Subclasses" {
            let where_opt = value["where"].as_object();
            if let Some(where_obj) = where_opt {
                // The index name must be classId (for now)
                let class_id_opt = where_obj.get("classId");
                if let Some(class_id_val) = class_id_opt {
                    let class_id_opt = class_id_val.as_str();
                    if let Some(class_id_str) = class_id_opt {
                        // The classId must be a valid AccounNumber
                        let ac_res = AccountNumber::from_exact(&class_id_str);
                        if let Ok(class_id_ac) = ac_res {
                            // The class must exist
                            let row_opt = ClassesTable::new().get_index_pk().get(&class_id_ac);
                            if let Some(_) = row_opt {
                                // We pass the classId to ArgoQueryValidator
                                let res = Box::new(ArgoQueryValidator {
                                    selector_str: selector_str.to_owned(),
                                    class_id_ac,
                                });
                                Ok(res)
                            } else {
                                Err(ValidationError::custom(
                                    Location::new(),
                                    path,
                                    value,
                                    "The argoQuery classId cannot be found",
                                ))
                            }
                        } else {
                            Err(ValidationError::custom(
                                Location::new(),
                                path,
                                value,
                                "Invalid AccountNumber for classId",
                            ))
                        }
                    } else {
                        Err(ValidationError::custom(
                            Location::new(),
                            path,
                            value,
                            "The classId predicate must be a string",
                        ))
                    }
                } else {
                    Err(ValidationError::custom(
                        Location::new(),
                        path,
                        value,
                        "The where clause must have a classId",
                    ))
                }
            } else {
                Err(ValidationError::custom(
                    Location::new(),
                    path,
                    value,
                    "The argoQuery must have a where clause",
                ))
            }
        } else {
            // selector is Context Object. Dont do anything
            let res = Box::new(ArgoQueryValidator {
                selector_str: selector_str.to_owned(),
                class_id_ac: AccountNumber::from(0),
            });
            Ok(res)
        }
    } else {
        Err(ValidationError::custom(
            Location::new(),
            path,
            value,
            "The argoQuery must have a selector property",
        ))
    }
}
