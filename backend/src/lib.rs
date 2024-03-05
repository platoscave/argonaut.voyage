#[allow(non_snake_case)]
#[psibase::service]
mod service {
    use psibase::*;
    use serde::{Deserialize, Serialize};

    // Same as before
    #[table(name = "MessageTable", index = 0)]
    #[derive(Fracpack, Reflect, Serialize, Deserialize)]
    pub struct Message {
        #[primary_key]
        id: u64,

        from: AccountNumber,
        to: AccountNumber,
        content: String,
    }

    impl Message {
        // Secondary keys must be functions; unlike primary_key, the
        // secondary_key attribute does not work on data members.
        //
        // The first secondary key is 1 (the primary key is 0).
        #[secondary_key(1)]
        fn by_from(&self) -> (AccountNumber, u64) {
            // Secondary keys must be unique. If we only returned
            // self.from, then a user would only be able to store a
            // single message.
            (self.from, self.id)
        }

        #[secondary_key(2)]
        fn by_to(&self) -> (AccountNumber, u64) {
            (self.to, self.id)
        }
    }

    // Same as before
    #[table(name = "LastUsedTable", index = 1)]
    #[derive(Default, Fracpack, Reflect, Serialize, Deserialize)]
    pub struct LastUsed {
        lastMessageId: u64,
    }

    // Same as before
    impl LastUsed {
        #[primary_key]
        fn pk(&self) {}
    }

    // Same as before
    fn get_next_message_id() -> u64 {
        let table = LastUsedTable::new();
        let mut lastUsed =
            table.get_index_pk().get(&()).unwrap_or_default();
        lastUsed.lastMessageId += 1;
        table.put(&lastUsed).unwrap();
        lastUsed.lastMessageId
    }

    // Same as before
    #[action]
    fn storeMessage(to: AccountNumber, content: String) -> u64 {
        let message_table = MessageTable::new();
        let id = get_next_message_id();
        message_table
            .put(&Message {
                id,
                from: get_sender(),
                to,
                content,
            })
            .unwrap();
        id
    }

    #[action]
    fn serveSys(request: HttpRequest) -> Option<HttpReply> {
        let message_table = MessageTable::new();

        let re = regex::Regex::new(
            "^/messages/([a-z]+)/([a-z]+)/([0-9]+)/([0-9]+)$"
        ).unwrap();
        if let Some(captures) = re.captures(&request.target) {
            let index_name = &captures[1];
            let account: AccountNumber = captures[2].parse().unwrap();
            let begin: u64 = captures[3].parse().unwrap();
            let end: u64 = captures[4].parse().unwrap();

            // /messages/from/user/begin/end
            if index_name == "from" {
                // We named our secondary key "by_from"
                let index = message_table.get_index_by_from();

                return Some(HttpReply {
                    contentType: "application/json".into(),
                    body: serde_json::to_vec(
                        &index
                            .range((account, begin)..(account, end))
                            .collect::<Vec<_>>(),
                    )
                    .unwrap()
                    .into(),
                    headers: vec![],
                });
            }

            // /messages/to/user/begin/end
            if index_name == "to" {
                let index = message_table.get_index_by_to();

                return Some(HttpReply {
                    contentType: "application/json".into(),
                    body: serde_json::to_vec(
                        &index
                            .range((account, begin)..(account, end))
                            .collect::<Vec<_>>(),
                    )
                    .unwrap()
                    .into(),
                    headers: vec![],
                });
            }
        }

        serve_simple_ui::<Wrapper>(&request)
    }
}