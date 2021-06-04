
#include <blockprocess.hpp>

using namespace rapidjson;
/*float blockprocess::stof(std::string s, float def)
    {   
        if (s == "") return def;
        std::size_t i = s.find(".");
        int digits = s.length() - i - 1;
        s.erase(i, 1); 
        return atoi(s.c_str()) / pow(10, digits);
    }*/

ACTION blockprocess::upsert(upsert_str payload) {
  name username = payload.username;
  // Will fail if the user does not sign the transaction 
  require_auth( username );
  // or require the contract athority. _self is the account that constructed the contract
  // require_auth( get_self() );


  const char* charDoc = payload.document.c_str();

  Document parsedJson;
  ParseResult ok = parsedJson.Parse(charDoc);

  check(ok, ("JSON parse error: %s (%u)",
            GetParseError_En(ok.Code()), ok.Offset()));
  

  // Get the _id from payload
  check(parsedJson.HasMember("_id"), "Proposed upsert has no _id:\n");
  auto _id = name(parsedJson["_id"].GetString());

  print("UPSERT: ", parsedJson["_id"].GetString());

 
  auto classId = UINT64_MAX;
  auto parentId = UINT64_MAX;
 
/*
  if(_id != name("gzthjuyjca4s")){ // Exception for the root
    if(parsedJson.HasMember("classId")) {
      // Use the value from payload as foreign key
      classId = name(parsedJson["classId"].GetString());
      // Make sure the foreigne key exsits
      auto docs_iter = doc_tbl.find( classId.value );
      check( docs_iter != doc_tbl.end(), "classId not found:\n");

      // Collect schema from classes
      // Validate document
    }
    else if(parsedJson.HasMember("parentId")) {
      // Use the value from payload as foreign key
      parentId = name(parsedJson["parentId"].GetString());
      // Make sure the foreigne key exsits
      auto docs_iter = doc_tbl.find( parentId.value );
      check( docs_iter != doc_tbl.end(), "parentId not found: " + payload.document);
    }
    else check( false, "Must have either parentId or classId: " + payload.document);
  }
  
*/
  auto docs_iter = doc_tbl.find( _id.value );
  if( docs_iter == doc_tbl.end() )
  {
    // username - payer: usually the user
    // [&]: labda function, annomonus
    doc_tbl.emplace(username, [&]( auto& new_doc ) {
      new_doc._id = _id;
      new_doc.parentid = parentId;
      new_doc.classid = classId;
      new_doc.document = payload.document;
    });
  }
  else {
    doc_tbl.modify( docs_iter, _self, [&]( auto& existing_doc ) {
      existing_doc.parentid = parentId;
      existing_doc.classid = classId;
      existing_doc.document = payload.document;
    });
  }
}

ACTION blockprocess::eraseall(eraseall_str payload) {
  // Example send transactions https://eosio.stackexchange.com/questions/1214/delete-all-multi-index-records-without-iterator
  name username = payload.username;
  require_auth(username);

  for(auto docs_iter = doc_tbl.begin(); docs_iter != doc_tbl.end();) {
      // delete element and update iterator reference
      docs_iter = doc_tbl.erase(docs_iter);
  }

}

/*
ACTION blockprocess::erase(erase_str payload) {
  name username = payload.username;
  name _id = payload._id;
  require_auth(username);

  auto docs_iter = doc_tbl.find(_id.value);
  if(docs_iter != doc_tbl.end()) doc_tbl.erase(docs_iter);

}


ACTION blockprocess::nextstep(nextstep_str payload) {
  name username = payload.username;
  name agreementid = payload.agreementid;
  std::string action = payload.action;
  require_auth(username);

  print("{ \"nextstep\": ", payload.toJson(), ",\n");


  // Get the agreement
  auto docs_iter = doc_tbl.find( agreementid.value );
  check(docs_iter != doc_tbl.end(), "Couldn't find the agreement: " + agreementid.to_string());
  auto parsedAgreement = json::parse(docs_iter->document, nullptr, false);
  check(!parsedAgreement.is_discarded(), "Invalid Json: " + docs_iter->document);


  // Get the agreement process stack
  auto agreementstack_iterator = agreementstack_tbl.find( agreementid.value );
  check(agreementstack_iterator != agreementstack_tbl.end(), "Couldn't find the process stack for this agreement: " + agreementid.to_string());
  auto stack = agreementstack_iterator->stack;
  

    name stateId = name("aaaaaaaaaaaaa");
    bool executeType = false;
    bool delegateType = false;

  // do {

    // get the current processstate
    processstate_str currentProcessState = stack.back();



    // If current state is initializing, set the current stateId to the process substateId
    if ( currentProcessState.stateid == name("gczvalloctae") ) { // Initialize state
        
      // Get the process obj
      auto docs_iter = doc_tbl.find( currentProcessState.processid.value );
      check(docs_iter != doc_tbl.end(), "Couldn't find the process obj: " + currentProcessState.processid.to_string());
      auto parsedProcessJson = json::parse(docs_iter->document, nullptr, false);
      check(!parsedProcessJson.is_discarded(), "Invalid Json: " + docs_iter->document);

      // Get the substateId from processObj
      check(parsedProcessJson.HasMember("substateId"), "Stack process has no substateId:\n" + parsedProcessJson.dump(4));
      auto substateid = name(parsedProcessJson["substateId"].get<std::string>());

      // Use substateid as current stateId
      currentProcessState.stateid = substateid;
      currentProcessState.updated_at = current_time_point();
      stack.back() = currentProcessState;

    }


    // If current state isA Delegate and not done, find the sellerProcessId, add it the the stack
    else if ( isA(currentProcessState.stateid, name("jotxozcetpx2") ) && currentProcessState.done == false) { // Delegate state

      // Set current ProcessState to done, so that on the way back we continu
      currentProcessState.done = true;
      currentProcessState.updated_at = current_time_point();
      stack.back() = currentProcessState;

      // Get the sellerProcessId from agreementObj
      check(parsedAgreement.HasMember("sellerProcessId"), "agreementObj has no sellerProcessId: " + agreementid.to_string());
      auto sellerProcessId = name(parsedAgreement["sellerProcessId"].get<std::string>());

      // Create a processstate with Initialize state and current process. Push it to the stack.
      processstate_str processState = { name(sellerProcessId), name("gczvalloctae"), false, current_time_point() }; 
      stack.push_back( processState );

    }


    else { 

      // If current state isA Execute, do stuf and set the next action
      if ( isA(currentProcessState.stateid, name("dqja423wlzrb") ) ) { // Execute state
        // Skip for now
        action = "happy";
      }
      
      print("ACTION:", action, "\n");


      // Process the action
      check( !action.empty(), "No action provided: " + agreementid.to_string());

      // Get stateObj from processStackObj.stateId
      auto docs_iter = doc_tbl.find( currentProcessState.stateid.value );
      check(docs_iter != doc_tbl.end(), "Couldn't find the state obj: " + currentProcessState.stateid.to_string());
      auto parsedStateJson = json::parse(docs_iter->document, nullptr, false);
      check(!parsedStateJson.is_discarded(), "Invalid Json: " + docs_iter->document);


      // Get the nextStateIds from state obj
      check(parsedStateJson.HasMember("nextStateIds"), "State process has no nextStateIds:\n" + parsedStateJson.dump());
      auto nextStateIds = parsedStateJson["nextStateIds"];

      // Find the nextStateIds obj that corresponds with our action
      auto actionStateIter = std::find_if(nextStateIds.begin(), nextStateIds.end(), [=](const json& actionStateObj) {
          auto it = actionStateObj.find("action");
          return it != actionStateObj.end() and (*it) == action;
      });

      // If found, use the nextStateId
      if(actionStateIter != nextStateIds.end()) {
        auto nextStateIdIter = actionStateIter->find("stateId");
        check(nextStateIdIter != actionStateIter->end(), "nextStateIds has no stateId for action: " + action + "\n" + parsedStateJson.dump());

        std::string next = nextStateIdIter.value();
        currentProcessState.stateid = name(next);
        currentProcessState.updated_at = current_time_point();
        stack.back() = currentProcessState;

      }

      // We couldn't find a nextStateId, so we return
      else {

        // Are we in a sub process? If so, send action to super process
        if( stack.size() > 1) {
          // Remove the end processStack
          stack.pop_back();
        }
        else {
          // Otherwize we are at the end
          if (action == "happy") currentProcessState.stateid = name("3hxkire2nn4v"); // Sucess
          else currentProcessState.stateid = name("zdwdoqpxks2s"); // Failed
          currentProcessState.updated_at = current_time_point();
          stack.back() = currentProcessState;

          // TODO cleanup agreementstack, Update agreement 
        }
      
      }

    }


    // Update the agreement stack table
    agreementstack_tbl.modify( agreementstack_iterator, _self, [&]( auto& existing_stack ) {
      existing_stack.stack = stack;
    });

    // get the current processstate
    currentProcessState = stack.back();

    print("\"result\": ", currentProcessState.toJson(), " }\n");

      /*char buffer[32];
      time_t current_time = current_time_point().sec_since_epoch();
      std::strftime(buffer, sizeof(buffer), "%FT%TZ", std::gmtime(&current_time));
      print( buffer, "\n" );* /

    stateId = currentProcessState.stateid;
    executeType = isA(stateId, name("dqja423wlzrb")); // Execute Type
    delegateType = isA(stateId, name("jotxozcetpx2")); // Delegate Type
    

    //TODO We may have to relace SEND_INLINE_ACTION with do while
    if( executeType || delegateType || stateId == name("gczvalloctae" )) {
      nextstep_str bumpsatePayload = { username, agreementid, action };

      // SEND_INLINE_ACTION( *this, nextstep, { username, name("active") }, bumpsatePayload );
      nextstep( bumpsatePayload );
    }

  // } while (executeType || delegateType || stateId == name("gczvalloctae")); // Initialize
    
}

// Recusivly get the document. Check to see if the parentId equals saughtId.
bool blockprocess::isA ( name _id, name saughtId ) {
  auto iterator = doc_tbl.find( _id.value );
  check(iterator != doc_tbl.end(), "_id could not be found: " + _id.to_string());
  if(iterator->classid == saughtId || iterator->parentid == saughtId) return true;
  else if (iterator->parentid != name("aaaaaaaaaaaa")) return isA (iterator->parentid, saughtId);
  return false; // no parent class, we are at the root
}
*/

