//import Vue from 'vue'
//const JSZip = require("jszip");
import { db } from "./dexieServices";
import { getClassSchema } from "~/lib/argoUtils"

class GenerateCpp {

    // https://github.com/EOSIO/eos/blob/c9b7a2472dc3c138e64d07ec388e64340577bb34/contracts/identity/identity.cpp#L105

    static async GenerateCpp(_id) {

        // Recusivly merge all the ancestor classes, starting with the root. Sub class properties take precedence over parent class
        /* const getMergeAncestorClasses = async classId => {
            let classObj = await store.dispatch("getCommonByKey", classId)
            if (classObj.superClassId) {
                let parentClassObj = await getMergeAncestorClasses(classObj.superClassId)
                return _.mergeWith(parentClassObj, classObj, (a, b) => {
                    if (_.isArray(a)) return a.concat(b) // Arrays must be concanated instead of merged
                })
            } else return classObj
        } */


        // let zip = new JSZip();
        // PR: gzthjuyjca4s
        // Pages: 
        //let classObj = await getClassSchema(_id)
        let classObj = this.basicContract()
        //return this.hppSource(classObj)
        return this.cppSource(classObj)

    }
    static generateUpsertString(properties) {
        let upsertSrting = ''
        // Keys must come first. Otherwise we get a wierd complier error on type name.
        for (let key in properties) {
            const prop = properties[key]
            if (prop.type === 'string') {
                if (prop.pattern === '[.abcdefghijklmnopqrstuvwxyz12345]{12}') upsertSrting += `      name ${key},\n`
            }
        }
        for (let key in properties) {
            const prop = properties[key]
            if (prop.type === 'string') {
                if (prop.pattern !== '[.abcdefghijklmnopqrstuvwxyz12345]{12}') upsertSrting += `      std::string ${key},\n`
            }
            else if (prop.type === 'number') {
                upsertSrting += `      std::float64 ${key},\n`
            }
            else if (prop.type === 'boolean') {
                upsertSrting += `      std::bool ${key},\n`
            }
            else if (prop.type === 'date') {
                upsertSrting += `      std::time_point_sec ${key},\n`
            }
            else if (prop.type === 'object') {
                if (prop.property) {
                    upsertSrting += `      // OBJECT ${key},\n`
                }
            }
            else if (prop.type === 'array') {
                if (prop.items) {
                    upsertSrting += `      std::vector<${key}_struct> ${key},\n`
                }
            }
        }
        let lastTwo = upsertSrting.substr(upsertSrting.length - 2)
        if (lastTwo === ',\n') upsertSrting = upsertSrting.substring(0, upsertSrting.length - 2)
        return upsertSrting
    }

    static hppSource(classObj) {

        const className = this.toCamelCase(classObj.title);
        const tableName = classObj.key;

        let keyStruct = ''
        for (let key in classObj.properties) {
            if (key === 'key') keyStruct += `\n      uint64_t primary_key() const { return key.value; }\n`
            else {
                const prop = classObj.properties[key]
                if (prop.pattern === '[.abcdefghijklmnopqrstuvwxyz12345]{12}') keyStruct += `      uint64_t by_${key}() const { return ${key}.value; }` + '\n'
            }
        }
        let lastOne = keyStruct.substr(keyStruct.length - 1)
        if (lastOne === '\n') keyStruct = keyStruct.substring(0, keyStruct.length - 1)

        let tableStructs = this.generateTableStructs(className, classObj.properties, keyStruct)

        let upsertSrting = this.generateUpsertString(classObj.properties)

        let indexSrting = ''
        for (let key in classObj.properties) {
            if (key !== 'key') {
                let lowerCaseKey = key.toLowerCase()
                const prop = classObj.properties[key]
                if (prop.pattern === '[.abcdefghijklmnopqrstuvwxyz12345]{12}')
                    indexSrting += `      indexed_by<name("${lowerCaseKey}"), const_mem_fun<${className}_struct, uint64_t, &${className}_struct::by_${key}>>,\n`
            }
        }
        let lastTwo = indexSrting.substr(indexSrting.length - 2)
        if (lastTwo === ',\n') indexSrting = indexSrting.substring(0, indexSrting.length - 2)

        let validateString = this.generateValidateHpp(className, classObj.properties)

        let hppString =
            `#include <eosio/eosio.hpp>\n` +
            `#include <eosio/print.hpp>\n\n` +
            `using namespace eosio;\n\n` +
            `// ${classObj.title} Contract\n\n` +
            `CONTRACT ${tableName} : public contract {\n` +
            `  public:\n` +
            `    using contract::contract;\n` +
            `    ${tableName}(name receiver, name code, datastream<const char*> ds):\n` +
            `        contract(receiver, code, ds), \n` +
            `        ${className}_tbl(receiver, receiver.value) {}\n\n` +
            `    // ${classObj.title} Structures\n\n` +
            `${tableStructs}\n\n` +
            `    // ${classObj.title} Actions\n\n` +
            `    ACTION upsert(name username, \n` +
            `${upsertSrting});\n\n` +
            `    ACTION erase(name username, name key);\n\n` +
            `    ACTION eraseall(name username);\n\n` +
            `  private:\n\n` +
            `    typedef multi_index<\n` +
            `      name("${tableName}"), ${className}_struct, \n` +
            `${indexSrting}\n` +
            `      > ${className}_def;\n\n` +
            `    ${className}_def ${className}_tbl;\n\n` +
            `${validateString}\n\n` +
            `};`

        return hppString

    }

    static generateTableStructs(structName, properties, keyStruct) {
        let tableStruct = ''
        // Keys must come before orther attrs other wise we get wierd compiler
        for (let key in properties) {
            const prop = properties[key]
            if (prop.type === 'string') {
                if (prop.pattern === '[.abcdefghijklmnopqrstuvwxyz12345]{12}') tableStruct += `      name ${key};\n`
            }
        }
        
        for (let key in properties) {
            const prop = properties[key]
            if (prop.type === 'string') {
                if (prop.pattern !== '[.abcdefghijklmnopqrstuvwxyz12345]{12}') tableStruct += `      std::string ${key};\n`
            }
            if (prop.type === 'array') {
                tableStruct += `      std::vector<${key}_struct> ${key};\n`
            }
        }

        let lastOne = tableStruct.substr(tableStruct.length - 1)
        if (lastOne === '\n') tableStruct = tableStruct.substring(0, tableStruct.length - 1)

        let tableStructString =
            `    TABLE ${structName}_struct {\n` +
            `${tableStruct}\n${keyStruct}\n` +
            `    };\n`


        for (let key in properties) {
            const prop = properties[key]
            if (prop.type === 'array') {
                // The order is important
                tableStructString = this.generateTableStructs(key, prop.items.properties, '') + tableStructString
            }
        }
        return tableStructString

    }

    static generateValidateHpp(structName, properties) {
        let upsertSrting = this.generateUpsertString(properties)

        let validateString =
            `    void validate_${structName}(\n` +
            `${upsertSrting}\n` +
            `    );\n`

        for (let key in properties) {
            const prop = properties[key]
            if (prop.type === 'array') {
                // The order is important
                validateString = this.generateValidateHpp(key, prop.items.properties) + validateString
            }
        }
        return validateString

    }

    // cpp file

    static async cppSource(classObj) {

        const className = this.toCamelCase(classObj.title);
        const tableName = classObj.key;

        let tableStruct = ''
        for (let key in classObj.properties) {
            tableStruct += `      iter.${key} = ${key};\n`
        }
        let lastOne = tableStruct.substr(tableStruct.length - 1)
        if (lastOne === '\n') tableStruct = tableStruct.substring(0, tableStruct.length - 1)

        let upsertSrting = this.generateUpsertString(classObj.properties)

        let validateString = this.generateValidateCpp(tableName, classObj.properties)

        let cppString =
            `#include <${tableName}.hpp>\n\n` +
            `// ${classObj.title} Contract\n\n` +
            `ACTION ${tableName}::upsert(name user, \n` +
            `${upsertSrting}) {\n` +
            `  // Will fail if the user does not sign the transaction\n` +
            `  require_auth( user );\n` +
            `  // or require the contract athority\n` +
            `  // require_auth( get_self() );\n\n` +
            `  auto ${className}_iterator = ${className}_tbl.find(key.value);\n` +
            `  if( ${className}_iterator == ${className}_tbl.end() )\n` +
            `  {\n` +
            `    // payer: usually the user\n` +
            `    // [&]: labda function, annomonus\n` +
            `    ${className}_iterator = ${className}_tbl.emplace(user, [&]( auto& iter ) {\n` +
            `${tableStruct}\n` +
            `    });\n` +
            `  }\n` +
            `  else {\n` +
            `    ${className}_tbl.modify( ${className}_iterator, _self, [&]( auto& iter ) {\n` +
            `${tableStruct}\n` +
            `    });\n` +
            `  }\n` +
            `}\n\n` +
            `ACTION ${tableName}::erase(name user, name key) {\n` +
            `  require_auth(user);\n\n` +
            `  auto ${className}_iterator = ${className}_tbl.find(key.value);\n` +
            `  check(${className}_iterator != ${className}_tbl.end(), "Record does not exist");\n` +
            `  ${className}_tbl.erase(${className}_iterator);\n` +
            `}\n\n` +
            `ACTION ${tableName}::eraseall(name user) {\n` +
            `  require_auth(user);\n\n` +
            `  for(auto ${className}_iterator = ${className}_tbl.begin(); ${className}_iterator != ${className}_tbl.end();) {\n` +
            `      // delete element and update iterator reference\n` +
            `      ${className}_iterator = ${className}_tbl.erase(${className}_iterator);\n` +
            `  }\n` +
            `}\n\n` +
            `${validateString}\n\n`
        // `EOSIO_DISPATCH(${className}, (upsert)(erase)(eraseall))\n`

        return cppString
    }

    static generateValidateCpp(structName, properties) {

        const getValidateParms = properties => {
            let parmsSrting = ''
            // We must use the same order ofor parms as we do in getUpsertString
            for (let key in properties) {
                const prop = properties[key]
                if (prop.pattern === '[.abcdefghijklmnopqrstuvwxyz12345]{12}') parmsSrting += `\n          value.${key},`
            }
            for (let key in properties) {
                const prop = properties[key]
                if (prop.pattern !== '[.abcdefghijklmnopqrstuvwxyz12345]{12}') parmsSrting += `\n          value.${key},`
            }
            let lastOne = parmsSrting.substr(parmsSrting.length - 1)
            if (lastOne === ',') parmsSrting = parmsSrting.substring(0, parmsSrting.length - 1)
            return parmsSrting
        }
        let upsertSrting = this.generateUpsertString(properties)

        let validateCode = ''
        for (let key in properties) {
            validateCode += `\n    // Validate ${key}\n`
            const prop = properties[key]
            if (prop.pattern === '[.abcdefghijklmnopqrstuvwxyz12345]{12}') {
                validateCode += `    // perform regex on ${key}\n`
                if (prop.query && prop.query.where) {
                    validateCode += `    // lookup ${key} in table ${prop.query.where[0].value}\n`
                }
            }
            if (prop.maxLength) validateCode += `    // eosio_assert(${key}.size() <= ${prop.maxLength}, "${structName}::${key} must be shorter or equal to ${prop.maxLength} bytes");\n`
            if (prop.minLength) validateCode += `    // eosio_assert(${key}.size() >= ${prop.minLength}, "${structName}::${key} must be longer or equal to ${prop.minLength} bytes");\n`
            if (prop.max) validateCode += `    // eosio_assert(${key} <= ${prop.max}, "${structName}::${key} must be less than or equal to ${prop.max} bytes");\n`
            if (prop.min) validateCode += `    // eosio_assert(${key} >= ${prop.min}, "${structName}::${key} must be greater than or equal to ${prop.min} bytes");\n`
            if (prop.format === 'date-time') validateCode += `    // date-time ${key}\n`
            if (prop.enum) {
                validateCode += `    // enum ${key}\n`
            }
            if (prop.media && prop.media.mediaType === 'text/html') validateCode += `    // text/html ${key}\n`
            if (prop.type === 'array') validateCode += `    for ( const auto& value : ${key} ) {\n      validate_${key}( ${getValidateParms(prop.items.properties)} );\n    }`

        }
        let lastOne = validateCode.substr(validateCode.length - 1)
        if (lastOne === '\n') validateCode = validateCode.substring(0, validateCode.length - 1)

        let validateString =
            `\n// Validate ${structName} structure\n` +
            `void validate_${structName} (\n` +
            `${upsertSrting}) {\n` +
            `${validateCode}\n` +
            `}\n`

        for (let key in properties) {
            const prop = properties[key]
            if (prop.type === 'array') {
                // The order is important
                validateString = this.generateValidateCpp(key, prop.items.properties) + validateString
            }
        }
        return validateString

    }

    static toCamelCase(str) {
        return str.split(' ').map(function (word, index) {
            // If it is the first word make sure to lowercase all the chars.
            if (index == 0) {
                return word.toLowerCase();
            }
            // If it is not the first word only upper case the first char and lowercase the rest.
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        }).join('');
    }

    static basicContract() {
        return {
            key: 'argonautvoya',
            title: 'Argonaut Voyage',
            properties: {
                key: {
                    description: '<p>Base32 identifier.</p>',
                    pattern: '[.abcdefghijklmnopqrstuvwxyz12345]{12}',
                    title: '_id',
                    type: 'string'
                },
                classId: {
                    pattern: '[.abcdefghijklmnopqrstuvwxyz12345]{12}',
                    argoQuery: {
                        where: {
                            classId: 'gzthjuyjca4s'
                        },
                        sortBy: 'name',
                        extendTo: 'Subclasses'
                    },
                    title: 'Class',
                    type: 'string'
                },
                superClassId: {
                    pattern: '[.abcdefghijklmnopqrstuvwxyz12345]{12}',
                    argoQuery: {
                        where: {
                            classId: 'gzthjuyjca4s'
                        },
                        sortBy: 'name',
                        extendTo: 'Subclasses'
                    },
                    title: 'Super Class',
                    type: 'string'
                },
                ownerId: {
                    pattern: '[.abcdefghijklmnopqrstuvwxyz12345]{12}',
                    argoQuery: {
                        where: {
                            classId: 'gzthjuyjca4s'
                        },
                        sortBy: 'name',
                        extendTo: 'Subclasses'
                    },
                    title: 'Owner',
                    type: 'string'
                },
                document: {
                    title: 'Document',
                    type: 'string'
                },
            },
        }

    }
}

export default GenerateCpp