<template>
    <div>404 not found component</div>
</template>

<script>
    export default {
        metaInfo: {
            title: 'News - Not found',
        },
        beforeMount() {
            if (window.location.search.includes('overrideErrorPage')) {
                return;
            }
            window.dispatchEvent(new CustomEvent('ilc:404', {
                detail: {
                    appId: this.$root.appId
                }
            }));
        },
    }
</script>