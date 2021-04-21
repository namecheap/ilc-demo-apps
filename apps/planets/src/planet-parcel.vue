<template>
    <div class="rootDiv">
        <div v-if="!loadingErr">
            <div v-if="loading">
                Loading planed information...
            </div>
            <div v-if="!loading">
                <h2>{{selectedPlanet.name}}</h2>
                <Attributes :selected-planet="selectedPlanet"/>
            </div>
        </div>
        <div v-if="loadingErr">
            Error while loading planed data: {{loadingErr}}
        </div>
    </div>
</template>

<script>
import Attributes from './selected-planet/info-tabs/attributes.vue';
import {getPlanet} from './utils/api.js';

export default {
    props: {
        id: Number,
    },
    watch: {
        id: function (newVal) {
            this.fetch(newVal);
        },
    },
    data: () => ({
        selectedPlanet: undefined,
        loading: true,
        loadingErr: undefined,
    }),
    components: {
        Attributes,
    },
    mounted: function () {
        this.subscriptions = []
        this.fetch(this.id)
    },
    beforeDestroy: function () {
        this.subscriptions.forEach(cancelable => {
            cancelable.unsubscribe();
        });
    },
    methods: {
        fetchWithNum: function (page) {
            this.fetch(page);
        },
        fetch: function (id = this.id) {
            this.loading = true;
            this.loadingErr = undefined;

            this.subscriptions.push(getPlanet(id).subscribe(
                (result) => {
                    this.selectedPlanet = result;
                    this.loading = false;
                },
                (err) => {
                    this.loading = false;
                    this.loadingErr = err.message;
                    console.error('Error while loading planed data', err);
                }
            ))
        }
    }
}
</script>