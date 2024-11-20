#![allow(non_snake_case)]
#![allow(dead_code, unused_variables)]
use crate::service::ClassesTable;
use crate::service::ObjectsTable;
use psibase::HttpReply;
use psibase::HttpRequest;
use psibase::Table;
use serde_json::Value;

pub fn serve_rest_api(request: &HttpRequest) -> Option<HttpReply> {
    //let re = regex::Regex::new("^/([a-z]+)/([0-9]+)/([0-9]+)$").unwrap();
    let re = regex::Regex::new("^/([a-z]+)/([0-9]+)$").unwrap();
    if let Some(captures) = re.captures(&request.target) {
        let table_name = &captures[1];
        //write_console(&format!("captures {:#?}", captures));

        // /classes/10
        if table_name == "classes" {
            let n: u64 = captures[2].parse().unwrap();

            let content_arr: Vec<Value> = ClassesTable::new()
                .get_index_pk()
                .iter()
                .take(n as usize)
                .map(|row| serde_json::from_str(&row.class_str).unwrap())
                .collect();

            return Some(HttpReply {
                status: 200,
                contentType: "application/json".into(),
                body: serde_json::to_vec(&content_arr).unwrap().into(),
                headers: vec![],
            });
        }

        // /merged/10
        if table_name == "merged" {
            let n: u64 = captures[2].parse().unwrap();

            let content_arr: Vec<Value> = ClassesTable::new()
                .get_index_pk()
                .iter()
                .take(n as usize)
                .map(|row| serde_json::from_str(&row.merged_ancestors_str).unwrap())
                .collect();

            return Some(HttpReply {
                status: 200,
                contentType: "application/json".into(),
                body: serde_json::to_vec(&content_arr).unwrap().into(),
                headers: vec![],
            });
        }

        // /objects/10
        if table_name == "objects" {
            let table_name = &captures[1];
            //write_console(&format!("captures {:#?}", captures));

            if table_name == "objects" {
                let n: u64 = captures[2].parse().unwrap();

                let content_arr: Vec<Value> = ObjectsTable::new()
                    .get_index_pk()
                    .iter()
                    .take(n as usize)
                    .map(|row| serde_json::from_str(&row.object_str).unwrap())
                    .collect();

                return Some(HttpReply {
                    status: 200,
                    contentType: "application/json".into(),
                    body: serde_json::to_vec(&content_arr).unwrap().into(),
                    headers: vec![],
                });
            }
        }
        return None;
    }
    return None;
}
