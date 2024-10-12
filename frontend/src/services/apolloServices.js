
// Apollo
import { DefaultApolloClient } from '@vue/apollo-composable'
import { ApolloClient, createHttpLink, InMemoryCache } from '@apollo/client/core'
import { computed, watch } from 'vue'
import {
    provideApolloClient,
    useQuery
} from "@vue/apollo-composable";
import gql from 'graphql-tag'
import { onError } from '@apollo/client/link/error'
import { logErrorMessages } from '@vue/apollo-util'

const httpLink = createHttpLink({
    uri: 'http://argonaut.psibase.127.0.0.1.sslip.io:8080/graphql'
})
const cache = new InMemoryCache({
    typePolicies: {
        ClassRow: {
            keyFields: ["key"],
            //keyFields: ["key", "superclassId"],
        },
        ObjectRow: {
            keyFields: ["key"],
            //keyFields: ["key", "classId"],
        }
    }
})
const apolloClient = new ApolloClient({
    link: httpLink,
    cache,
})
// Handle errors
const errorLink = onError(error => {
    //if (process.env.NODE_ENV !== 'production') {
        logErrorMessages(error)
    //}
})
provideApolloClient(apolloClient);


class ApolloServices {


    static async psibaseToCache() {

        let GET_CLASSES = gql`
            query {
                getClasses (n: 10) {
                    key
                    superclassId
                }
            }
        `
        const { result, loading, onError, onResult } = useQuery(GET_CLASSES)

        //let classes = computed(result, [], data => data.classes)

        //console.log(classes)

        watch(result, value => {
            console.log(value)
        })


    }


    static testApollo() {
        let GET_CLASSES = gql`
            query {
                getClasses (n: 10) {
                    key
                    superclassId
                }
            }
        `
        let QUERY = gql`
            query {
                getClasses @client (key: $key) {
                    key
                    superclassId
                }
            }
        `
        const result = cache.readQuery({
            query: QUERY,
            // Provide any required variables in this object.
            // Variables of mismatched types will return `null`.
            variables: {
                key: "pages",
            },
        });

        watch(result, value => {
            console.log('pages: ',value)
        })


    }
}
export default ApolloServices