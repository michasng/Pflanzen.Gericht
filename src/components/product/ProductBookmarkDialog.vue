<script setup lang="ts">
import { onMounted, ref } from 'vue'
import AlertMessage from '@/components/AlertMessage.vue'
import LoadingText from '@/components/LoadingText.vue'
import ListForm from '@/components/list/ListForm.vue'
import Button from '@/components/primitives/ButtonComponent.vue'
import { ButtonVariant } from '@/components/primitives/ButtonVariant'
import type { ListSummary } from '@/lib/ListSummary'
import type { ListInput } from '@/services/ListGateway'

defineProps<{
  lists: ListSummary[]
  listIdsWithProduct: string[]
  loading: boolean
  loadError: string | null
  actionError: string | null
  togglingListId: string | null
  save: (input: ListInput) => Promise<void>
}>()

defineEmits<{ toggle: [listId: string]; close: [] }>()

const dialog = ref<HTMLElement | null>(null)
const creatingList = ref(false)

onMounted(() => dialog.value?.focus())
</script>

<template>
  <Teleport to="body">
    <div>
      <button
        type="button"
        tabindex="-1"
        class="fixed inset-0 z-40 bg-black/30"
        aria-label="Dialog schließen"
        @click="$emit('close')"
      ></button>

      <div
        ref="dialog"
        role="dialog"
        aria-modal="true"
        aria-label="Listen verwalten"
        tabindex="-1"
        class="fixed inset-x-4 top-1/2 z-50 max-h-[85dvh] -translate-y-1/2 overflow-y-auto rounded-2xl bg-white shadow-xl focus:outline-none sm:mx-auto sm:max-w-lg"
        @keydown.esc="$emit('close')"
      >
        <div
          class="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-4 py-3"
        >
          <h2 class="text-base font-semibold text-gray-900">Listen verwalten</h2>
          <Button ariaLabel="Schließen" :variant="ButtonVariant.Text" @click="$emit('close')">
            Schließen
          </Button>
        </div>

        <div class="space-y-4 p-4">
          <LoadingText v-if="loading" />
          <AlertMessage :message="loadError" />
          <ul v-if="!loading && !loadError" class="space-y-2">
            <li v-for="list in lists" :key="list.id">
              <button
                type="button"
                data-list-option
                class="flex w-full items-center justify-between gap-2 rounded-xl border border-gray-200 px-3 py-2 text-left text-sm text-gray-900 hover:border-primary-300 disabled:opacity-50"
                :aria-pressed="listIdsWithProduct.includes(list.id)"
                :disabled="togglingListId === list.id"
                @click="$emit('toggle', list.id)"
              >
                <span class="truncate">{{ list.name }}</span>
                <svg
                  v-if="listIdsWithProduct.includes(list.id)"
                  class="h-5 w-5 shrink-0 text-primary-600"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </button>
            </li>
          </ul>
          <AlertMessage :message="actionError" />

          <ListForm
            v-if="creatingList"
            id-prefix="bookmark-list"
            :save="save"
            @saved="creatingList = false"
            @cancel="creatingList = false"
          />
          <Button
            v-else-if="!loading && !loadError"
            ariaLabel="Neue Liste"
            :variant="ButtonVariant.Outlined"
            full-width
            @click="creatingList = true"
          >
            Neue Liste
          </Button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
