<script setup lang="ts">
// TODO Phase 4: ProductGrid, ProductFilters, catalogStore
</script>

<template>
  <div>
    <div class="mb-4">
      <div class="relative">
        <svg
          class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
          />
        </svg>
        <input
          type="search"
          placeholder="Vegane Produkte suchen …"
          class="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
      </div>
    </div>

    <div class="flex gap-2 overflow-x-auto pb-2 mb-6 -mx-4 px-4 scrollbar-none">
      <button
        class="shrink-0 px-4 py-1.5 rounded-full text-sm font-medium bg-primary-600 text-white"
      >
        Alle
      </button>
      <button
        class="shrink-0 px-4 py-1.5 rounded-full text-sm font-medium bg-white border border-gray-200 text-gray-600 hover:border-primary-300"
      >
        Fleisch-Ersatz
      </button>
      <button
        class="shrink-0 px-4 py-1.5 rounded-full text-sm font-medium bg-white border border-gray-200 text-gray-600 hover:border-primary-300"
      >
        Käse
      </button>
      <button
        class="shrink-0 px-4 py-1.5 rounded-full text-sm font-medium bg-white border border-gray-200 text-gray-600 hover:border-primary-300"
      >
        Milch
      </button>
      <button
        class="shrink-0 px-4 py-1.5 rounded-full text-sm font-medium bg-white border border-gray-200 text-gray-600 hover:border-primary-300"
      >
        Eier
      </button>
      <button
        class="shrink-0 px-4 py-1.5 rounded-full text-sm font-medium bg-white border border-gray-200 text-gray-600 hover:border-primary-300"
      >
        Originell
      </button>
      <button
        class="shrink-0 px-4 py-1.5 rounded-full text-sm font-medium bg-white border border-gray-200 text-gray-600 hover:border-primary-300"
      >
        Fertigprodukt
      </button>
    </div>

    <div class="flex flex-col items-center justify-center py-20 text-center">
      <svg
        class="w-20 h-20 text-gray-200 mb-4"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 008 20c6 0 7-8 7-8 3 3 3 8 2 11h2c1-6-1-11-2-15z"
        />
      </svg>
      <p class="text-gray-600 font-semibold text-lg mb-1">Noch keine Produkte vorhanden</p>
      <p class="text-gray-400 text-sm mb-6">Sei der Erste und füge ein veganes Produkt hinzu!</p>
      <RouterLink
        :to="{ name: 'product-new' }"
        class="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors"
      >
        <svg
          class="w-4 h-4"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Produkt hinzufügen
      </RouterLink>
    </div>
  </div>
</template>
