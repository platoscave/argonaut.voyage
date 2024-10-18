use crate::service::{ClassRow, ClassesTable};
use crate::utils::*;
use jsonschema::{Draft, JSONSchema};
use psibase::{Table, AccountNumber, check};
use serde_json::{Map, Value};
use psibase::services::events::Wrapper;

pub fn next_step(agreementId: &str, updatedProps: &str) {

    // Wrapper::emit().history().add(a, b, res);

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

/*
    // agreement_id to AccountNumber
    let res = AccountNumber::from_exact(&agreementId);
    check(
        res.is_ok(),
        &format!("\nInvalid agreement_id: {:#?}\nkey: {}", res, agreementId),
    );
    let agreement_id: AccountNumber = res.unwrap();

    // payload to serde Value
    let res = serde_json::from_str(&updatedProps);
    check(
        res.is_ok(),
        &format!("\nUnable to parse payload:\n{:#?}", res),
    );
    let updated_props: Value = res.unwrap();
*/
}
