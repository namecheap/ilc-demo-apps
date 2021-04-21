<template>
    <div>
        <div class="selectedPlanet" v-if='!!selectedPlanet'>
            <selected-planet
                v-bind:selectedPlanet='selectedPlanet'
            >
            </selected-planet>
        </div>
        <div class="selectedPlanet" v-if='!selectedPlanet'>
            No planet selected
            <hr/>
            <label>
                Demo parcel from React app, person ID: <br/>
                <input type="text" v-model="peopleId"/>
                <button @click="openDemoParcel">Open</button>
            </label>
            <div v-if="selectedId">
                <hr>
                <Parcel
                    :config="parcelConfig()"
                    :mountParcel="mountParcel"
                    :parcelProps="getParcelProps()"
                />
            </div>
        </div>
    </div>
</template>

<script>
import SelectedPlanet from './selected-planet.vue';
import Parcel from 'single-spa-vue/dist/esm/parcel';

export default {
    components: {
        SelectedPlanet,
        Parcel,
    },
    props: {
        selectedPlanet: Object
    },
    data() {
        return {
            peopleId: 1,
            selectedId: undefined,
            parcelConfig: () => window.ILC.importParcelFromApp('@portal/people', 'person')
        }
    },
    methods: {
        // These are the props passed into the parcel
        openDemoParcel() {
            console.log('HERE', this.peopleId)
            this.selectedId = this.peopleId;
        },
        getParcelProps() {
            return {
                id: this.selectedId,
            }
        },
    },
    inject: ['mountParcel'],
}
</script>
