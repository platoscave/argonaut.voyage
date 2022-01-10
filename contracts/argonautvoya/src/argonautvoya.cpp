#include <argonautvoya.hpp>

// Argonaut Voyage Contract

ACTION argonautVoyage::upsert(name user, 
      name key,
      name classId,
      name supperClassId,
      name ownerId,
      std::string document) {
  // Will fail if the user does not sign the transaction
  require_auth( user );
  // or require the contract athority
  // require_auth( get_self() );

  auto argonautVoyage_iterator = argonautvoya.find(key.value);
  if( argonautVoyage_iterator == argonautvoya.end() )
  {
    // payer: usually the user
    // [&]: labda function, annomonus
    argonautVoyage_iterator = argonautvoya.emplace(user, [&]( auto& iter_argonautVoyage ) {
      iter_argonautVoyage.key = key;
      iter_argonautVoyage.classId = classId;
      iter_argonautVoyage.supperClassId = supperClassId;
      iter_argonautVoyage.ownerId = ownerId;
      iter_argonautVoyage.document = document;
    });
  }
  else {
    argonautvoya.modify( argonautVoyage_iterator, _self, [&]( auto& iter_argonautVoyage ) {
      iter_argonautVoyage.key = key;
      iter_argonautVoyage.classId = classId;
      iter_argonautVoyage.supperClassId = supperClassId;
      iter_argonautVoyage.ownerId = ownerId;
      iter_argonautVoyage.document = document;
    });
  }
}

ACTION argonautVoyage::erase(name user, name key) {
  require_auth(user);

  auto argonautVoyage_iterator = argonautvoya.find(key.value);
  check(argonautVoyage_iterator != argonautvoya.end(), "Record does not exist");
  argonautvoya.erase(argonautVoyage_iterator);
}

ACTION argonautVoyage::eraseall(name user) {
  require_auth(user);

  for(auto argonautVoyage_iterator = argonautvoya.begin(); argonautVoyage_iterator != argonautvoya.end();) {
      // delete element and update iterator reference
      argonautVoyage_iterator = argonautvoya.erase(argonautVoyage_iterator);
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


