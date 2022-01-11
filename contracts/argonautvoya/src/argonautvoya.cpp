#include <argonautvoya.hpp>

// Argonaut Voyage Contract

ACTION argonautvoya::upsert(name user, 
      name key,
      name classId,
      name supperClassId,
      name ownerId,
      std::string document) {
  // Will fail if the user does not sign the transaction
  require_auth( user );
  // or require the contract athority
  // require_auth( get_self() );

  auto argonautVoyage_iterator = argonautVoyage_tbl.find(key.value);
  if( argonautVoyage_iterator == argonautVoyage_tbl.end() )
  {
    // payer: usually the user
    // [&]: labda function, annomonus
    argonautVoyage_iterator = argonautVoyage_tbl.emplace(user, [&]( auto& iter ) {
      iter.key = key;
      iter.classId = classId;
      iter.supperClassId = supperClassId;
      iter.ownerId = ownerId;
      iter.document = document;
    });
  }
  else {
    argonautVoyage_tbl.modify( argonautVoyage_iterator, _self, [&]( auto& iter ) {
      iter.key = key;
      iter.classId = classId;
      iter.supperClassId = supperClassId;
      iter.ownerId = ownerId;
      iter.document = document;
    });
  }
}

ACTION argonautvoya::erase(name user, name key) {
  require_auth(user);

  auto argonautVoyage_iterator = argonautVoyage_tbl.find(key.value);
  check(argonautVoyage_iterator != argonautVoyage_tbl.end(), "Record does not exist");
  argonautVoyage_tbl.erase(argonautVoyage_iterator);
}

ACTION argonautvoya::eraseall(name user) {
  require_auth(user);

  for(auto argonautVoyage_iterator = argonautVoyage_tbl.begin(); argonautVoyage_iterator != argonautVoyage_tbl.end();) {
      // delete element and update iterator reference
      argonautVoyage_iterator = argonautVoyage_tbl.erase(argonautVoyage_iterator);
  }
}


// Validate argonautvoya structure
void validate_argonautvoya (
      name key,
      name classId,
      name supperClassId,
      name ownerId,
      std::string document) {

    // Validate key
    // perform regex on key

    // Validate classId
    // perform regex on classId

    // Validate supperClassId
    // perform regex on supperClassId

    // Validate ownerId
    // perform regex on ownerId

    // Validate document
}


