<template>
    <div>
        <router-link class="close-link" :to="{name: 'planets-root'}">X</router-link>
        <div class='header'>
            {{ selectedPlanet.name }}
        </div>
    </div>

</template>

<script>
export default {
    props: {
        selectedPlanet: Object
    }
}
</script>

<style scoped>
.header {
    font-size: 32px;
}

.close-link {
    float: right;
    display: block;
    color: white;
    text-decoration: none;
    font-size: 20px;
}
</style>
