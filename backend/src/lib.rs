#![allow(non_snake_case)]
mod argoquery_validator;
mod classes;
mod http_request;
mod next_step;
mod objects;
mod utils;

#[psibase::service]
mod service {
    use async_graphql::connection::Connection;
    use async_graphql::*;
    use psibase::{AccountNumber, *};
    use serde::{Deserialize, Serialize};
    use serde_json::Value;

    #[table(name = "ClassesTable", index = 0)]
    #[derive(Fracpack, Serialize, Deserialize, SimpleObject, Debug)]
    pub struct ClassRow {
        #[primary_key]
        pub key: AccountNumber,
        pub superclass_id: AccountNumber,
        pub class_str: String,
        pub merged_ancestors_str: String,
    }

    impl ClassRow {
        #[secondary_key(1)]
        fn by_superclass_id(&self) -> (AccountNumber, AccountNumber) {
            (self.superclass_id.to_owned(), self.key.to_owned())
        }
    }

    #[table(name = "ObjectsTable", index = 1)]
    #[derive(Fracpack, Serialize, Deserialize, SimpleObject)]
    pub struct ObjectRow {
        #[primary_key]
        pub key: AccountNumber,
        pub class_id: AccountNumber,
        pub object_str: String,
    }

    impl ObjectRow {
        #[secondary_key(1)]
        fn by_class_id(&self) -> (AccountNumber, AccountNumber) {
            (self.class_id.to_owned(), self.key.to_owned())
        }
    }
    #[action]
    pub fn test() {}

    #[action]
    pub fn nextstep(agreementId: String, updatedProps: String) {
        // crate::next_step::next_step(&agreementId, &updatedProps);

        Wrapper::emit()
            .history()
            .nextstep(agreementId, updatedProps);
    }

    #[event(history)]
    pub fn nextstep(agreementId: String, updatedProps: String) {}

    #[action]
    pub fn upsert(payload: String) {
        //println!("payload {:#?}", payload);

        // payload to serde Value
        let res = serde_json::from_str(&payload);
        check(
            res.is_ok(),
            &format!("\nUnable to parse payload:\n{:#?}", res),
        );
        let payload_val: Value = res.unwrap();

        // Get the top level array of classes or objects
        let res = payload_val.as_array();
        check(
            res.is_some(),
            &format!(
                "\nExpected an array of objects or classes. \nGot: {:#?}",
                payload_val
            ),
        );
        let json_arr_vec = res.unwrap();

        // For each class/object
        for json_object in json_arr_vec {
            //println!("String {}", json_object);

            // If the object has a classId, its an object, otherwise its a class
            if json_object["classId"].is_string() {
                crate::objects::upsert_object(json_object);
            } else {
                crate::classes::upsert_class(json_object);
            }
        }

        Wrapper::emit().history().upsert(payload);
    }

    #[event(history)]
    pub fn upsert(payload: String) {}

    struct Query;
    #[Object]
    impl Query {
        // get the first n classes
        async fn getClasses(&self, n: u32) -> Vec<ClassRow> {
            ClassesTable::new()
                .get_index_pk()
                .iter()
                .take(n as usize)
                .collect()
        }

        // get the first n objects
        async fn getObjects(&self, n: u32) -> Vec<ObjectRow> {
            ObjectsTable::new()
                .get_index_pk()
                .iter()
                .take(n as usize)
                .collect()
        }

        // objectByKey(key)
        async fn objectByKey(&self, key: AccountNumber) -> ObjectRow {
            ObjectsTable::new().get_index_pk().get(&key).unwrap()
        }

        // classByKey(key)
        async fn classByKey(&self, key: AccountNumber) -> ClassRow {
            ClassesTable::new().get_index_pk().get(&key).unwrap()
        }

        // objectsByClassId(classId)
        async fn objectsByClassId(&self, classId: AccountNumber) -> Vec<ObjectRow> {
            let index = ObjectsTable::new().get_index_by_class_id();
            index.iter().filter(|row| row.class_id == classId).collect()
        }

        // classesBySuperclassId(superclassId)
        async fn classesBySuperclassId(&self, superclassId: AccountNumber) -> Vec<ClassRow> {
            let index = ClassesTable::new().get_index_by_superclass_id();
            index
                .iter()
                .filter(|row| row.superclass_id == superclassId)
                .collect()
        }

        // instancesByClassId(classId, [ownerIds])
        async fn instancesByClassId(&self, classId: AccountNumber) -> Vec<ObjectRow> {
            // result array
            let mut res_vec = Vec::new();
            // recursivly collect subclasses into the result array
            collect_subclasses(classId, &mut res_vec);
            // extract classIds
            let class_ids_vec: Vec<AccountNumber> = res_vec.iter().map(|row| row.key).collect();
            // collect objects that have a class_id contained in class_ids_vec
            let index = ObjectsTable::new().get_index_by_class_id();
            index.iter().filter(|row| class_ids_vec.contains(&row.class_id)).collect()
        }

        // subclassesByClassId(classId)
        async fn subclassesByClassId(&self, classId: AccountNumber) -> Vec<ClassRow> {
            // result array
            let mut res_vec = Vec::new();
            // recursivly collect subclasses into the result array
            collect_subclasses(classId, &mut res_vec);
            // return it
            res_vec
        }

        // byQueryIds([queryIds])

        async fn event(&self, id: u64) -> Result<event_structs::HistoryEvents, anyhow::Error> {
            get_event(id)
        }
    }

    // recusive helper to collect subclasses
    fn collect_subclasses(class_id: AccountNumber, res_vec: &mut Vec<ClassRow>) {
        // get the class and add it to the result array
        res_vec.push(ClassesTable::new().get_index_pk().get(&class_id).unwrap());

        let index = ClassesTable::new().get_index_by_superclass_id();
        // collect all the classes that have us as superclass_id
        let subclasses: Vec<ClassRow> = index
            .iter()
            .filter(|row| row.superclass_id == class_id)
            .collect();
        // for each of the subclasses, call ourselves
        for subclass in subclasses {
            collect_subclasses(subclass.key, res_vec)
        }
    }

    #[action]
    fn serveSys(request: HttpRequest) -> Option<HttpReply> {
        None.or_else(|| crate::http_request::serve_rest_api(&request))
            .or_else(|| serve_simple_ui::<Wrapper>(&request))
            .or_else(|| serve_graphql(&request, Query))
            .or_else(|| serve_graphiql(&request))
    }

    #[action]
    fn eraseAll() {
        crate::objects::erase_all_objects();
        crate::classes::erase_all_classes();
    }

    use rand::prelude::*;
    use rand_chacha::rand_core::SeedableRng;
    #[action]
    fn randomKeys(seed: u64) {
        let mut rng = SmallRng::seed_from_u64(seed);
        let mut count = 1;
        while count < 50 {
            let value: u64 = rng.gen();
            let name = AccountNumber::new(value);
            if name.to_string().len() > 7 {
                if !name.to_string().contains("-") {
                    let res = AccountNumber::from_exact(&name.to_string());
                    if let Ok(_) = res {
                        println!("-{},", name);
                        count += 1;
                    }
                }
            }
        }
        /*

        let newKeys = vec![
            "platoscave",
            "demouser-01",
            "demouser-02",
            "demouser-03",
            "demouser-04",
            "demouser-05",
            "demouser-06",
            "demouser-07",
            "demouser-08",
            "demouser-09",
            "demouser-10",
            "argonaut",
            "bikeshop",
            "clinic",
            "clinic-desk",
            "clinic-consult",
            "bikeshop-desk",
            "bikeshop-shop",
            "argonaut-serve",
            "argonaut-found",
            //"argonaut-voya",
            "argonaut-org",
            "demo-user-01",
            "demo-user-02",
            "demo-user-03",
            "demo-user-04",
            "demo-user-05",
            "demo-user-06",
            "demo-user-07",
            "demo-user-08",
            "demo-user-09",
            "demo-user-10",
        ];
        let newKeys_iter = newKeys.iter();
        for name in newKeys_iter {
            let res = AccountNumber::from_exact(&name.to_string());
            if let Err(_) = res {
                println!("{},", name);
            }
        }
        */
    }
}
