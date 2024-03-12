#[allow(non_snake_case)]
#[psibase::service]
mod service {
    use async_graphql::connection::Connection;
    use async_graphql::*;
    use base64::prelude::*;
    use json::*;
    use psibase::*;
    use serde::{Deserialize, Serialize};
    use serde_json::Value;

    // Same as before
    #[table(name = "ObjectsTable", index = 0)]
    #[derive(Fracpack, Reflect, Serialize, Deserialize, SimpleObject)]
    pub struct Objects {
        #[primary_key]
        key: AccountNumber,
        class_id: AccountNumber,
        content: String,
    }

    impl Objects {
        #[secondary_key(1)]
        fn by_class_id(&self) -> (AccountNumber, AccountNumber) {
            (self.class_id, self.key)
        }
    }

    #[action]
    fn add(a: i32, b: i32) -> i32 {
        println!("a {} b {}", a, b);
        a + b
    }

    #[action]
    pub fn upsert(objects_base64: String) -> u64 {
        // base64 to array
        let objects_bytes = BASE64_STANDARD
            .decode(&objects_base64)
            .expect("Unable to decode objects_arr_str");

        // array to string
        let objects_arr_str =
            String::from_utf8(objects_bytes).expect("Our bytes should be valid utf8");
        println!("String {}", objects_arr_str);

        // string to json Value
        let objects_arr: Value =
            serde_json::from_str(&objects_arr_str).expect("Unable to parse objects_arr");

        // get objects array
        let objects = objects_arr
            .as_array()
            .expect("Expected an array of objects");

        // For each object
        for object_json in objects {
            // Get key
            let key = object_json["key"].as_str().expect("Unable to parse key");
            println!("Key is {}", key);

            // Validate classId
            let class_id = object_json["classId"]
                .as_str()
                .expect("Unable to parse classId");
            // lookup classId
            println!("class_id is {}", class_id);

            // Validate assocs, array of assocs

            // for (key, value) in object_json.as_object().expect("Unable to parse object") {
            //     let last_two = {
            //         let split_pos = key.char_indices().nth_back(1).unwrap().0;
            //         &key[split_pos..]
            //     };
            //     println!("Id {:?}", last_two);
            //     if last_two == "Id" {
            //         if let Some(object_id) = value.as_str().expect("Unable to parse object_id") {
            //             println!("Matched {:?}!", object_id);
            //             // lookup object_id
            //         }
            //     }
            // }

            // Get the compiled validator by classId

            // Validate object by validator

            // Write json
            let objects_table = ObjectsTable::new();
            objects_table
                .put(&Objects {
                    key: key.into(),
                    class_id: class_id.into(),
                    content: object_json.to_string(),
                })
                .unwrap();
        }
        300
    }

    pub fn check_objectmodel(objectId: &str) {
        // look for orphan objects (look out for loops)
    }

    pub fn remove_all() {
        //
    }

    pub fn remove_object(key: &str) {
        //
    }
    struct Query;
    #[Object]
    impl Query {
        async fn objects(
            &self,
            first: Option<i32>,
            last: Option<i32>,
            before: Option<String>,
            after: Option<String>,
        ) -> async_graphql::Result<Connection<RawKey, Objects>> {
            TableQuery::new(ObjectsTable::new().get_index_pk())
                .first(first)
                .last(last)
                .before(before)
                .after(after)
                .query()
                .await
        }

        async fn objectsByFrom(
            &self,
            from: AccountNumber,
            first: Option<i32>,
            last: Option<i32>,
            before: Option<String>,
            after: Option<String>,
        ) -> async_graphql::Result<Connection<RawKey, Objects>> {
            TableQuery::subindex::<u64>(ObjectsTable::new().get_index_by_class_id(), &from)
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
}
