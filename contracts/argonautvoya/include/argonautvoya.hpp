#include <eosio/eosio.hpp>
#include <eosio/print.hpp>

using namespace eosio;

// Argonaut Voyage Contract

CONTRACT argonautvoya : public contract {
  public:
    using contract::contract;
    argonautvoya(name receiver, name code, datastream<const char*> ds):
        contract(receiver, code, ds), 
        argonautVoyage_tbl(receiver, receiver.value) {}

    // Argonaut Voyage Structures

    TABLE argonautVoyage_struct {
      name key;
      name classId;
      name superClassId;
      name ownerId;
      std::string document;

      uint64_t primary_key() const { return key.value; }
      uint64_t by_classId() const { return classId.value; }
      uint64_t by_superClassId() const { return superClassId.value; }
      uint64_t by_ownerId() const { return ownerId.value; }
    };


    // Argonaut Voyage Actions

    ACTION upsert(name username, 
      name key,
      name classId,
      name superClassId,
      name ownerId,
      std::string document);

    ACTION erase(name username, name key);

    ACTION eraseall(name username);

  private:

    typedef multi_index<
      name("argonautvoya"), argonautVoyage_struct, 
      indexed_by<name("classid"), const_mem_fun<argonautVoyage_struct, uint64_t, &argonautVoyage_struct::by_classId>>,
      indexed_by<name("superClassId"), const_mem_fun<argonautVoyage_struct, uint64_t, &argonautVoyage_struct::by_superClassId>>,
      indexed_by<name("ownerid"), const_mem_fun<argonautVoyage_struct, uint64_t, &argonautVoyage_struct::by_ownerId>>
      > argonautVoyage_def;

    argonautVoyage_def argonautVoyage_tbl;

    void validate_argonautVoyage(
      name key,
      name classId,
      name superClassId,
      name ownerId,
      std::string document
    );

};
EOSIO_DISPATCH(argonautvoya, (upsert)(erase)(eraseall))