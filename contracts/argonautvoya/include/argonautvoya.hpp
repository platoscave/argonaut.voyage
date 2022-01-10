#include <eosio/eosio.hpp>
#include <eosio/print.hpp>

using namespace eosio;

// Argonaut Voyage Contract

CONTRACT argonautvoya : public contract {
  public:
    using contract::contract;
    argonautvoya(name receiver, name code, datastream<const char*> ds):
        contract(receiver, code, ds), 
        argonautvoya(receiver, receiver.value) {}

    // Argonaut Voyage Structures

    TABLE argonautVoyage_struct {
      name key;
      name classId;
      name supperClassId;
      name ownerId;
      std::string document;
      uint64_t primary_key() const { return key.value; }
      uint64_t by_classId() const { return classId.value; }
      uint64_t by_supperClassId() const { return supperClassId.value; }
      uint64_t by_ownerId() const { return ownerId.value; }
    };


    // Argonaut Voyage Actions

    ACTION upsert(name username, 
      name key,
      name classId,
      name supperClassId,
      name ownerId,
      std::string document);

    ACTION erase(name username, name key);

    ACTION eraseall(name username);

  private:

    typedef multi_index<name("argonautvoya"), argonautVoyage_struct, 

      indexed_by<name("classid"), const_mem_fun<argonautVoyage_struct, uint64_t, &argonautVoyage_struct::by_classId>>,
      indexed_by<name("supperclassid"), const_mem_fun<argonautVoyage_struct, uint64_t, &argonautVoyage_struct::by_supperClassId>>,
      indexed_by<name("ownerid"), const_mem_fun<argonautVoyage_struct, uint64_t, &argonautVoyage_struct::by_ownerId>>
      > argonautVoyage_table;

    argonautVoyage_table argonautvoya;

    void validate_argonautVoyage(
      name key,
      name classId,
      name supperClassId,
      name ownerId,
      std::string document
    );


};