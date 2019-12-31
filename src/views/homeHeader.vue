<template>
<div>
    <span> color</span>
    {{this.message}}
</div>
</template>

<script>
export default {
    data() {
        return {
            message: 'hello'
        }
    }

}
</script>

<style>
span {
    color:green;
}

</style>