
#include <eosio/eosio.hpp>
#include <eosio/print.hpp>
//#include <eosio/time.hpp>

#include <eosio/system.hpp>
#include "rapidjson/document.h"
#include "rapidjson/writer.h"
#include "rapidjson/stringbuffer.h"
#include "rapidjson/reader.h"
#include "rapidjson/error/en.h" // rapidjson::ParseResult
//#include <chrono>
//#include <ctime>
// #include <src/nlohmann/json-schema.hpp>
// #include <jsoncons/json_reader.hpp>
// https://github.com/pboettch/json-schema-validator

// using jsoncons::json;
//using json = nlohmann::json;
//using nlohmann::json_schema::json_validator;

using namespace eosio;

CONTRACT blockprocess : public contract {
  private:
    TABLE document_str {
      name key;
      name parentid;
      name classid;
      std::string document;
      
      uint64_t primary_key() const { return key.value; }
      uint64_t by_parentid() const { return parentid.value; }
      uint64_t by_classid() const { return classid.value; }
    };
    
    typedef multi_index<name("documents"), document_str, 
      indexed_by<name("byparentid"), const_mem_fun<document_str, uint64_t, &document_str::by_parentid>>, 
      indexed_by<name("byclassid"), const_mem_fun<document_str, uint64_t, &document_str::by_classid>>> documents_def;
      
    documents_def doc_tbl;

  /*
    struct processstate_str {
      name processid;
      name stateid;
      bool done;
      time_point_sec updated_at;
  */

    /*std::string isoTimestamp() {
      char buffer[32];
      time_t current_time = updated_at.sec_since_epoch();
      std::strftime(buffer, sizeof(buffer), "%FT%TZ", std::gmtime(&current_time));
      return buffer;
    }*/
    /*
      std::string toJson() {
        return "{\n    \"processId\": \"" + processid.to_string() + "\", " + 
          "\n    \"stateid\": \"" + stateid.to_string() + "\", " + 
          "\n    \"done\": " + (done ? "true" : "false") + "\", " + 
          "\n    \"updated_at\": \"" + "isoTimestamp()" + "\"\n}";
      }
  
    };
  */

//    bool isA( name superClassId, name saughtId );

  public:
    using contract::contract;
    blockprocess(name receiver, name code, 
      datastream<const char*> ds):contract(receiver, code, ds), 
      doc_tbl(receiver, receiver.value) {}
    
    struct upsert_str {
      name username;
      std::string document;
      EOSLIB_SERIALIZE( upsert_str, (username) (document) )
    };
    ACTION upsert(upsert_str payload);
    
    struct eraseall_str {
      name username;
      EOSLIB_SERIALIZE( eraseall_str, (username) )
    };
    ACTION eraseall(eraseall_str payload);

/*
    struct erase_str {
      name username;
      name key;
      EOSLIB_SERIALIZE( erase_str, (username) (key))
    };
    ACTION erase(erase_str payload);
   
    struct nextstep_str {
      name username;
      name agreementid;
      std::string action;
      
      std::string toJson() {
        return "{\n    \"username\": \"" + username.to_string() + "\", " + 
          "\n    \"agreementid\": \"" + agreementid.to_string() + "\", " + 
          "\n    \"action\": \"" + action + "\"\n}"; 
      }

      EOSLIB_SERIALIZE( nextstep_str, (username) (agreementid) (action))
    };
    ACTION nextstep(nextstep_str payload);
   */
};
