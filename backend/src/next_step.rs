use serde_json::Value;

pub fn next_step(agreement_id: &str, updated_props: &Value) {
    let key = updated_props["key"].as_str().expect("Unable to parse key");

    // get the agreement by agreementId
    // verify that the current user is authorized for a unit that is responsible for agreement.stepId
    // get the current step by agreement.step
    // get mutable properties from the step
    // remove properties from new_object that are not mutable
    // get the current_object Value by key
    // update values in current_object Value (exclude key)
    // get the compiled validator by classId
    // validate object by validator
    // validate any assocs / array of assocs
    // write the current_object Value with key, indexes
    // Update agreement.stepId
}
