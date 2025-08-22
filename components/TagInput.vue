<template>
    <div @click="focusInput" class="w-full p-2 bg-white border border-gray-300 rounded-md shadow-sm flex flex-wrap items-center gap-2 cursor-text">
        <!-- Pills for existing tags -->
        <div v-for="(tag, index) in modelValue" :key="tag" class="flex items-center bg-blue-100 text-blue-800 text-sm font-semibold px-2 py-1 rounded-full">
            <span>{{ tag }}</span>
            <button @click.stop="removeTag(index)" type="button" class="ml-1.5 -mr-0.5 text-blue-500 hover:text-blue-700 focus:outline-none">
                &times;
            </button>
        </div>

        <!-- The actual input field for new tags -->
        <input ref="inputRef" v-model="newTag" @keydown.enter.prevent="addTag" @keydown.,.prevent="addTag" @keydown.backspace="handleBackspace" @paste="handlePaste" :placeholder="placeholder" class="flex-grow bg-transparent focus:outline-none p-1 text-gray-700" />
    </div>
</template>

<script setup>
const props = defineProps({
    modelValue: {
        type: Array,
        required: true,
    },
    placeholder: {
        type: String,
        default: 'Add tags...',
    },
});

const emit = defineEmits(['update:modelValue']);

const newTag = ref('');
const inputRef = ref(null);

const addTag = () => {
    const tagToAdd = newTag.value.trim();
    if (tagToAdd && !props.modelValue.includes(tagToAdd)) {
        const newTags = [...props.modelValue, tagToAdd];
        emit('update:modelValue', newTags);
    }
    newTag.value = '';
};

const removeTag = (index) => {
    const newTags = props.modelValue.filter((_, i) => i !== index);
    emit('update:modelValue', newTags);
};

const handleBackspace = () => {
    if (newTag.value === '' && props.modelValue.length > 0) {
        removeTag(props.modelValue.length - 1);
    }
};

const handlePaste = (event) => {
    event.preventDefault();
    const pastedText = event.clipboardData.getData('text');
    const pastedTags = pastedText.split(',').map(t => t.trim()).filter(Boolean);

    if (pastedTags.length > 0) {
        const combined = [...props.modelValue, ...pastedTags];
        const unique = [...new Set(combined)]; // Remove duplicates
        emit('update:modelValue', unique);
    }
};

const focusInput = () => {
    inputRef.value?.focus();
};
</script>