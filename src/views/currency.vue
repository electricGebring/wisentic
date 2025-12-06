<script setup lang="ts">
import { onMounted, ref, computed, nextTick } from 'vue'
import { useCurrencyStore } from '@/stores/currency'

// Hämta Pinia-storen för valutakurser
const store = useCurrencyStore()

// State för sökfältet
const search = ref('')

// Spåra vilken kod som redigeras (ex: 'USD', 'EUR')
const editingCode = ref<string | null>(null)

// Spåra vilket fält som redigeras ('value' eller 'unit')
const editingField = ref<'value' | 'unit' | null>(null)

// Hämta data från storen när komponenten monteras
onMounted(async () => {
  await store.fetchExchangeRates()
})

// Formatera tal enligt svenska standarder (6 decimaler max)
const valueFormatter = new Intl.NumberFormat('sv-SE', {
  maximumFractionDigits: 6,
})

// Computed: Filtrera och sortera valutorna baserat på sökfältet
const filteredAndSortedRates = computed(() => {
  // Få alla valuta-entries från storen
  const entries = Object.entries(store.exchangeRates || {})
  // Gör söktermen till gemener för case-insensitive sökning
  const q = search.value.trim().toLowerCase()
  
  // Filtrera baserat på kod, namn eller enhet
  const filtered = q
    ? entries.filter(([code, r]) => {
        return (
          code.toLowerCase().includes(q) ||
          (r.name && String(r.name).toLowerCase().includes(q)) ||
          (r.unit && String(r.unit).toLowerCase().includes(q))
        )
      })
    : entries
  
  // Sortera alfabetiskt efter valutakod
  return filtered.sort(([a], [b]) => a.localeCompare(b))
})

// Starta redigering av ett fält (value eller unit)
const startEdit = async (code: string, field: 'value' | 'unit', currentValue: string | number) => {
  editingCode.value = code
  editingField.value = field
  
  // Vänta på att DOM uppdateras innan vi hittar elementet
  await nextTick()
  
  // Hitta input-elementet baserat på kod och fält
  const el = document.querySelector(`[data-edit-code="${code}"][data-edit-field="${field}"]`) as HTMLDivElement
  if (el) {
    // Sätt innehållet till det nuvarande värdet
    el.textContent = String(currentValue)
    // Fokusera på elementet
    el.focus()
    
    // Markera all text så den kan bytas ut direkt
    const range = document.createRange()
    range.selectNodeContents(el)
    const sel = window.getSelection()
    sel?.removeAllRanges()
    sel?.addRange(range)
  }
}

// Spara ändringar till storen
const saveEdit = (code: string, field: 'value' | 'unit') => {
  const el = document.querySelector(`[data-edit-code="${code}"][data-edit-field="${field}"]`) as HTMLDivElement
  
  // Kontrollera att elementet och valutan existerar
  if (el && store.exchangeRates[code]) {
    if (field === 'value') {
      // Konvertera till nummer för värde-fältet
      const newValue = Number(el.textContent || '')
      // Validera att det är ett giltigt nummer
      if (!isNaN(newValue)) {
        store.exchangeRates[code].value = newValue
      }
    } else if (field === 'unit') {
      // Spara enheten direkt (ex: 'SEK', 'USD')
      store.exchangeRates[code].unit = el.textContent || ''
    }
  }
  
  // Stäng redigeringslägget
  editingCode.value = null
  editingField.value = null
}
</script>

<template>
  <div class="max-w-2xl mx-auto p-6">
    <!-- Rubrik och sökfält -->
    <div class="mb-6">
      <h1 class="text-2xl font-semibold mb-4">Valutakurser</h1>

      <!-- Sökfält för att filtrera valutorna -->
      <input
        v-model="search"
        placeholder="Sök kod (ex: AUD, USD), namn eller enhet..."
        class="w-full px-4 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
      />
    </div>

    <!-- Laddnings-spinner medan data hämtas -->
    <div v-if="store.loading" class="space-y-3">
      <div v-for="n in 8" :key="n" class="h-24 bg-gray-100 animate-pulse rounded-lg"></div>
    </div>

    <!-- Felmeddelande om något gick fel vid hämtning -->
    <div v-else-if="store.error" class="p-4 bg-red-50 text-red-700 rounded">
      Fel vid hämtning: {{ store.error }}
    </div>

    <!-- Lista över valutorna -->
    <div v-else>
      <div class="space-y-3">
        <!-- Loopa igenom alla filtrerade och sorterade valutor -->
        <article
          v-for="([code, rate], index) in filteredAndSortedRates"
          :key="code"
          class="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition"
        >
          <div class="flex items-start justify-between gap-4">
            <!-- Vänster sida: Kod, namn och enhet -->
            <div class="flex-1">
              <div class="text-xs text-gray-500 uppercase tracking-wider">{{ code }}</div>
              <div class="text-lg font-semibold">{{ rate.name }}</div>
              
              <!-- Enhet med klickbar redigering -->
              <div class="text-sm text-gray-600 mt-1">
                Enhet:
                <!-- Visa enheten när den inte redigeras -->
                <span
                  v-if="!(editingCode === code && editingField === 'unit')"
                  class="cursor-pointer hover:text-sky-600 transition"
                  @click="startEdit(code, 'unit', rate.unit)"
                >
                  {{ rate.unit }}
                </span>
                
                <!-- Contenteditable div för redigering av enhet -->
                <div
                  v-if="editingCode === code && editingField === 'unit'"
                  :data-edit-code="code"
                  data-edit-field="unit"
                  contenteditable="true"
                  @keydown.enter.prevent="saveEdit(code, 'unit')"
                  @keydown.escape="saveEdit(code, 'unit')"
                  @blur="saveEdit(code, 'unit')"
                  class="px-2 py-1 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-sky-300 w-16 bg-white inline-block"
                />
              </div>
            </div>

            <!-- Höger sida: Värde och typ-badge -->
            <div class="text-right">
              <!-- Contenteditable div för redigering av värde -->
              <div v-if="editingCode === code && editingField === 'value'" class="mb-2">
                <div
                  :data-edit-code="code"
                  data-edit-field="value"
                  contenteditable="true"
                  @keydown.enter.prevent="saveEdit(code, 'value')"
                  @keydown.escape="saveEdit(code, 'value')"
                  @blur="saveEdit(code, 'value')"
                  class="px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-sky-300 w-24 bg-white"
                />
              </div>
              
              <!-- Visa värdet när det inte redigeras (klickbar för redigering) -->
              <div
                v-else
                class="text-2xl font-bold cursor-pointer hover:text-sky-600 transition"
                @click="startEdit(code, 'value', rate.value)"
              >
                {{ valueFormatter.format(rate.value) }}
              </div>
              
              <!-- Type-badge (Crypto eller Fiat) -->
              <span
                class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-2"
                :class="rate.type === 'crypto' ? 'bg-purple-100 text-purple-800' : 'bg-sky-100 text-sky-800'"
              >
                {{ rate.type }}
              </span>
            </div>
          </div>
        </article>
      </div>

      <!-- Meddelande när inget motsvarar sökningen -->
      <div v-if="filteredAndSortedRates.length === 0" class="mt-6 text-sm text-gray-600">
        Inga resultat för sökningen.
      </div>
    </div>
  </div>
</template>