<script setup lang="ts">
import { useSlots } from 'vue'
import { TextInputState } from '@/components/primitives/TextInputState'

const props = withDefaults(
  defineProps<{
    id: string
    type?: 'text' | 'email' | 'password'
    autocomplete?: string
    required?: boolean
    minlength?: number
    maxlength?: number
    placeholder?: string
    state?: TextInputState
  }>(),
  { type: 'text', required: false, state: TextInputState.Default },
)

defineOptions({ inheritAttrs: false })

const model = defineModel<string>({ required: true })
const slots = useSlots()

const BORDER_CLASSES: Record<TextInputState, string> = {
  [TextInputState.Default]: 'border-gray-200',
  [TextInputState.Invalid]: 'border-red-300',
  [TextInputState.Valid]: 'border-green-400',
}

const getInputClasses = (): string[] => [
  'w-full py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
  slots.prefix ? 'pl-7' : 'pl-3',
  slots.suffix ? 'pr-8' : 'pr-3',
  BORDER_CLASSES[props.state],
]
</script>

<template>
  <div class="relative">
    <span
      v-if="$slots.prefix"
      class="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 select-none"
      aria-hidden="true"
    >
      <slot name="prefix" />
    </span>
    <input
      v-bind="$attrs"
      :id="id"
      v-model="model"
      :type="type"
      :autocomplete="autocomplete"
      :required="required"
      :minlength="minlength"
      :maxlength="maxlength"
      :placeholder="placeholder"
      :class="getInputClasses()"
    />
    <span
      v-if="$slots.suffix"
      class="absolute right-3 top-1/2 -translate-y-1/2 text-xs"
      aria-live="polite"
    >
      <slot name="suffix" />
    </span>
  </div>
</template>
