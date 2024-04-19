
// Apollo
import { DefaultApolloClient } from '@vue/apollo-composable'
import { ApolloClient, createHttpLink, InMemoryCache } from '@apollo/client/core'
import { computed, watch } from 'vue'
import {
    provideApolloClient,
    useQuery} from "@vue/apollo-composable";

import gql from 'graphql-tag'

class ApolloServices {


    static async psibaseToCache() {

        const httpLink = createHttpLink({
            uri: 'http://argonaut.psibase.127.0.0.1.sslip.io:8080/graphql'
        })
        const cache = new InMemoryCache()
        const apolloClient = new ApolloClient({
            link: httpLink,
            cache,
        })

        //provideApolloClient(apolloClient);
        provideApolloClient(apolloClient);

        const { result, loading, onError, onResult } = useQuery(gql`
            query {
                getClasses (n: 10) {
                    key
                    superclassId
                }
            }
        `)

        let classes = computed(result, [], data => data.classes)

        console.log(classes)

        watch(result, value => {
            console.log(value)
        })
        // const query = provideApolloClient(apolloClient)(() => useQuery(gql`
        //     query {
        //         getClasses (n: 10) {
        //             key
        //             superclassId
        //         }
        //     }
        // `))
        // console.log(query.result)
        //const hello = computed(() => console.log(query.result.value))

    }
}
export default ApolloServices