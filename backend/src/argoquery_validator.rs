use jsonschema::{
    paths::{LazyLocation, Location},
    ErrorIterator, Keyword, ValidationError,
};
use serde_json::{json, Map, Value};
use std::iter::once;

// Step 1: Implement the Keyword trait
struct ArgoQueryValidator  {
    selector: String,
    refs_arr: Vec<String>
}

impl Keyword for ArgoQueryValidator{
    fn validate<'instance>(
        &self,
        instance: &'instance Value,
        instance_path: &LazyLocation,
    ) -> ErrorIterator<'instance> {
        println!("value = {:?}", instance);
        println!("selector = {:?}", &self.selector);
        println!("refs_arr = {:?}", &self.refs_arr);
        if &self.selector == "Context Object" {
            Box::new(None.into_iter())
        } else {
            let error = ValidationError::custom(
                Location::new(),
                instance_path.into(),
                instance,
                "Number must be even",
            );
            Box::new(once(error))
        }
        // if let Value::Number(n) = instance {
        //     if n.as_u64().map_or(false, |n| n % 2 == 0) {
        //         Box::new(None.into_iter())
        //     } else {
        //         let error = ValidationError::custom(
        //             Location::new(),
        //             instance_path.into(),
        //             instance,
        //             "Number must be even",
        //         );
        //         Box::new(once(error))
        //     }
        // } else {
        //     let error = ValidationError::custom(
        //         Location::new(),
        //         instance_path.into(),
        //         instance,
        //         "Value must be a number",
        //     );
        //     Box::new(once(error))
        // }
    }

    fn is_valid(&self, instance: &Value) -> bool {
        instance.as_u64().map_or(false, |n| n % 2 == 0)
    }
}

// Step 2: Create a factory function
pub fn argo_query_validator_factory<'a>(
    _parent: &'a Map<String, Value>,
    value: &'a Value,
    path: Location,
) -> Result<Box<dyn Keyword>, ValidationError<'a>> {
    // println!("value = {:?}", value);

    let res = value["selector"].as_str();
    if res.is_none() {
        ValidationError::custom(
            Location::new(),
            path.clone(),
            value,
            "The argoQuery must have a selector property",
        );
    }
    let selector: &str = res.unwrap();

    let res = value["where"].as_object();
    if res.is_none() {
        ValidationError::custom(
            Location::new(),
            path,
            value,
            "The argoQuery must have a where clasue",
        );
    }
    let where_clause = res.unwrap();
    let refs_arr: Vec<String> = where_clause
        .values()
        .map(|value| value.as_str().unwrap().to_owned())
        .collect();

    let res = Box::new(ArgoQueryValidator {
        selector: selector.to_owned(),
        refs_arr: refs_arr
    });
    Ok(res)
}
