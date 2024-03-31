#![allow(non_snake_case)]
#![allow(dead_code, unused_variables)]
mod classes;
mod next_step;
mod objects;
//mod utils;

#[psibase::service]
mod service {
    use async_graphql::connection::Connection;
    use async_graphql::*;
    //use json::*;
    use psibase::{AccountNumber, *};
    use serde::{Deserialize, Serialize};
    use serde_json::Value;
    //crate::utils::ArgoKey;

    #[table(name = "ClassesTable", index = 0)]
    #[derive(Fracpack, Reflect, Serialize, Deserialize, SimpleObject)]
    pub struct ClassRow {
        #[primary_key]
        pub key: AccountNumber,
        pub superclass_id: AccountNumber,
        pub content: String,
    }
    // impl ClassRow {
    //     #[primary_key]
    //     fn get_primary_key(&self) -> String {
    //         self.key.to_owned()
    //     }

    // }
    impl ClassRow {
        #[secondary_key(1)]
        fn by_superclass_id(&self) -> (AccountNumber, AccountNumber) {
            (self.superclass_id.to_owned(), self.key.to_owned())
        }
    }

    #[table(name = "ObjectsTable", index = 1)]
    #[derive(Fracpack, Reflect, Serialize, Deserialize, SimpleObject)]
    pub struct ObjectRow {
        #[primary_key]
        pub key: AccountNumber,
        pub class_id: AccountNumber,
        pub content: String,
    }
    // impl ObjectRow {
    //     #[primary_key]
    //     fn get_primary_key(&self) -> String {
    //         self.key.to_owned()
    //     }
    // }
    impl ObjectRow {
        #[secondary_key(1)]
        fn by_class_id(&self) -> (AccountNumber, AccountNumber) {
            (self.class_id.to_owned(), self.key.to_owned())
        }
    }
    #[action]
    pub fn upsert(payload: String) {
        //println!("payload {:#?}", payload);

        // String to json Value
        let res = serde_json::from_str(&payload);
        check(
            res.is_ok(),
            &format!("\nUnable to parse payload:\n{:#?}", res),
        );
        let payload_val: Value = res.unwrap();

        // Get objects array
        let res = payload_val.as_array();
        check(
            res.is_some(),
            &format!(
                "\nExpected an array of json objects. \nGot: {:#?}",
                payload_val
            ),
        );
        let json_arr_vec = res.unwrap();

        // For each object
        for json_object in json_arr_vec {
            //println!("String {}", json_object);

            // If the object has a classId, its an object, otherwise its a class
            if json_object["classId"].is_string() {
                crate::objects::upsert_object(json_object);
            } else {
                crate::classes::upsert_class(json_object);
            }
        }
    }
    struct Query;
    #[Object]
    impl Query {
        async fn classes(
            &self,
            first: Option<i32>,
            last: Option<i32>,
            before: Option<String>,
            after: Option<String>,
        ) -> async_graphql::Result<Connection<RawKey, ClassRow>> {
            TableQuery::new(ClassesTable::new().get_index_pk())
                .first(first)
                .last(last)
                .before(before)
                .after(after)
                .query()
                .await
        }

        async fn objects(
            &self,
            first: Option<i32>,
            last: Option<i32>,
            before: Option<String>,
            after: Option<String>,
        ) -> async_graphql::Result<Connection<RawKey, ObjectRow>> {
            TableQuery::new(ObjectsTable::new().get_index_pk())
                .first(first)
                .last(last)
                .before(before)
                .after(after)
                .query()
                .await
        }

        async fn objectsByClassId(
            &self,
            classId: AccountNumber,
            first: Option<i32>,
            last: Option<i32>,
            before: Option<String>,
            after: Option<String>,
        ) -> async_graphql::Result<Connection<RawKey, ObjectRow>> {
            TableQuery::subindex::<u64>(ObjectsTable::new().get_index_by_class_id(), &classId)
                .first(first)
                .last(last)
                .before(before)
                .after(after)
                .query()
                .await
        }
    }

    #[action]
    fn serveSys(request: HttpRequest) -> Option<HttpReply> {
        None.or_else(|| serve_simple_ui::<Wrapper>(&request))
            .or_else(|| serve_graphql(&request, Query))
            .or_else(|| serve_graphiql(&request))
    }
    // #[action]
    // fn serveSys(request: HttpRequest) -> Option<HttpReply> {
    // let message_table = ObjectsTable::new();

    // let re = regex::Regex::new("^/messages/([a-z]+)/([a-z]+)/([0-9]+)/([0-9]+)$").unwrap();
    // if let Some(captures) = re.captures(&request.target) {
    //     let index_name = &captures[1];
    //     let account: AccountNumber = captures[2].parse().unwrap();
    //     let begin: u64 = captures[3].parse().unwrap();
    //     let end: u64 = captures[4].parse().unwrap();

    //     // /messages/from/user/begin/end
    //     if index_name == "from" {
    //         // We named our secondary key "by_from"
    //         let index = message_table.get_index_by_from();

    //         return Some(HttpReply {
    //             contentType: "application/json".into(),
    //             body: serde_json::to_vec(
    //                 &index
    //                     .range((account, begin)..(account, end))
    //                     .collect::<Vec<_>>(),
    //             )
    //             .unwrap()
    //             .into(),
    //             headers: vec![],
    //         });
    //     }

    //     // /messages/to/user/begin/end
    //     if index_name == "to" {
    //         let index = message_table.get_index_by_to();

    //         return Some(HttpReply {
    //             contentType: "application/json".into(),
    //             body: serde_json::to_vec(
    //                 &index
    //                     .range((account, begin)..(account, end))
    //                     .collect::<Vec<_>>(),
    //             )
    //             .unwrap()
    //             .into(),
    //             headers: vec![],
    //         });
    //     }
    // }

    // serve_simple_ui::<Wrapper>(&request)
    //}
    use rand::prelude::*;
    use rand_chacha::rand_core::SeedableRng;
    #[action]
    fn randomKey(seed: u64) {
        let number = 300;
        let mut rng = SmallRng::seed_from_u64(seed);
        for num in 0..number {
            let value: u64 = rng.gen();
            let name = AccountNumber::new(value);
            if name.to_string().len() > 7 {
                if !name.to_string().contains("-") {
                    println!("\"{}\",", name);
                }
            }
        }
    }
}
