<!-- layouts/no-header.vue -->
<template>
    <div>
        <!-- The header component is explicitly excluded in this layout -->
        <slot />
        <!-- If your default layout also includes a footer that you *do* want on this page, add it here: -->
        <!-- <TheFooter /> -->
    </div>
</template>

<script setup>
// Any script setup for this specific layout, if needed
</script>