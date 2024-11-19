#![allow(non_snake_case)]
use crate::service::{ClassRow, ClassesTable};
use psibase::*;
use serde_json::Value;

pub fn accountnumber_from_value(val: &Value, prop_name: &str) -> AccountNumber {
    // Get the key str
    let key_str = str_from_value(val, prop_name);

    // Translate key to AccountNumber
    let res = AccountNumber::from_exact(&key_str);
    check(
        res.is_ok(),
        &format!("\nInvalid account name: {:#?}\nkey: {}", res, key_str),
    );
    res.unwrap()
}


pub fn str_from_value<'a>(val: &'a Value, prop_name: &str) -> &'a str {
    let res = val[prop_name].as_str();
    check(
        res.is_some(),
        &format!("\nUnable to parse {}\nGot: {:#?}", prop_name, val),
    );
    res.unwrap()
}

pub fn get_class_row_by_key(key: &AccountNumber) -> ClassRow {
    let row_opt = ClassesTable::new().get_index_pk().get(key);
    check(
        row_opt.is_some(),
        &format!("\nUnable to get class: {}", key),
    );
    row_opt.unwrap()
}
