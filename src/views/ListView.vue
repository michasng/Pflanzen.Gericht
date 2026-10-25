<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter, type RouteLocationRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAsyncData } from '@/composables/useAsyncData'
import { injectGateway } from '@/composables/injectGateway'
import { toErrorMessage } from '@/lib/error'
import { toOwnProfileTabLocation } from '@/lib/toOwnProfileTabLocation'
import { listGatewayKey, type ListInput } from '@/services/ListGateway'
import { profileGatewayKey } from '@/services/ProfileGateway'
import AlertMessage from '@/components/AlertMessage.vue'
import LoadingText from '@/components/LoadingText.vue'
import NotFoundMessage from '@/components/NotFoundMessage.vue'
import ListForm from '@/components/list/ListForm.vue'
import ListHeader from '@/components/list/ListHeader.vue'
import ListProductsSection from '@/components/list/ListProductsSection.vue'
import { ProfileTab } from '@/components/profile/ProfileTab'
import Button from '@/components/primitives/ButtonComponent.vue'
import { ButtonSize } from '@/components/primitives/ButtonSize'
import { ButtonTone } from '@/components/primitives/ButtonTone'
import { ButtonVariant } from '@/components/primitives/ButtonVariant'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const listGateway = injectGateway(listGatewayKey)
const profileGateway = injectGateway(profileGatewayKey)

const {
  data: listPage,
  loading,
  errorMessage,
  notFound,
  reload,
} = useAsyncData(
  async (listId: string) => {
    const list = await listGateway.fetchList(listId)
    if (!list) return null
    const owner = await profileGateway.fetchPublicProfile(list.ownerId)
    return owner ? { list, owner } : null
  },
  () => String(route.params.id),
)

const isEditing = ref(false)
const actionError = ref<string | null>(null)

const isOwner = computed(() => authStore.user?.id === listPage.value?.list.ownerId)
const ownerName = computed(
  () => listPage.value?.owner.displayName || listPage.value?.owner.username,
)
const ownerRoute = computed<RouteLocationRaw>(() => {
  if (isOwner.value) return toOwnProfileTabLocation(ProfileTab.Lists)
  return { name: 'profile-public', params: { id: listPage.value?.list.ownerId ?? '' } }
})

const saveList = async (input: ListInput): Promise<void> => {
  if (!listPage.value) return
  await listGateway.updateList(listPage.value.list.id, input)
}

const finishEditing = async (): Promise<void> => {
  isEditing.value = false
  await reload()
}

const deleteList = async (): Promise<void> => {
  if (!listPage.value) return
  if (!confirm('Liste wirklich löschen? Die Produkte bleiben erhalten.')) return

  actionError.value = null
  try {
    await listGateway.deleteList(listPage.value.list.id)
    await router.push(toOwnProfileTabLocation(ProfileTab.Lists))
  } catch (err) {
    actionError.value = toErrorMessage(err)
  }
}
</script>

<template>
  <div class="max-w-lg mx-auto space-y-4">
    <LoadingText v-if="loading" />
    <NotFoundMessage v-else-if="notFound" message="Liste nicht gefunden." />
    <AlertMessage v-else-if="errorMessage" :message="errorMessage" />

    <template v-else-if="listPage">
      <ListHeader
        :list="listPage.list"
        :ownerName="ownerName ?? ''"
        :ownerRoute="ownerRoute"
        :showVisibility="isOwner"
      />

      <template v-if="isOwner">
        <ListForm
          v-if="isEditing"
          idPrefix="edit-list"
          :initialName="listPage.list.name"
          :initialVisibility="listPage.list.visibility"
          :save="saveList"
          @saved="finishEditing"
          @cancel="isEditing = false"
        />
        <div v-else class="flex gap-2">
          <Button
            ariaLabel="Liste bearbeiten"
            :variant="ButtonVariant.Outlined"
            :size="ButtonSize.Small"
            @click="isEditing = true"
          >
            Bearbeiten
          </Button>
          <Button
            ariaLabel="Liste löschen"
            :variant="ButtonVariant.Outlined"
            :size="ButtonSize.Small"
            :tone="ButtonTone.Danger"
            @click="deleteList"
          >
            Löschen
          </Button>
        </div>
        <AlertMessage :message="actionError" />
      </template>

      <ListProductsSection :key="listPage.list.id" :listId="listPage.list.id" :isOwner="isOwner" />
    </template>
  </div>
</template>
