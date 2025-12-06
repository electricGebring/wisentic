import { defineStore } from 'pinia'

// Interface för en enskild valutakurs
interface CurrencyRate {
  name: string      // Fullständigt namn (ex: "US Dollar")
  unit: string      // Enhet/symbol (ex: "USD", "SEK")
  value: number     // Växlingskurs
  type: string      // Typ (ex: "fiat" eller "crypto")
}

// Interface för API-svaret från CoinGecko
interface ExchangeRatesResponse {
  rates: Record<string, CurrencyRate>
}

// Definiera Pinia-storen för valutakurser
export const useCurrencyStore = defineStore('currency', {
  // State: Det reaktiva objektet som lagrar data
  state: () => ({
    exchangeRates: {} as Record<string, CurrencyRate>,  // Alla valutakurser
    loading: false,                                       // Om data hämtas
    error: null as string | null,                         // Felmeddelande
  }),

  // Actions: Metoder för att uppdatera state
  actions: {
    // Hämta alla valutakurser från CoinGecko API
    async fetchExchangeRates() {
      this.loading = true
      this.error = null
      try {
        // Anropa CoinGecko API
        const response = await fetch('https://api.coingecko.com/api/v3/exchange_rates')
        
        // Kontrollera att response var ok
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
        
        // Tolka JSON-svaret
        const data: ExchangeRatesResponse = await response.json()
        
        // Uppdatera storen med alla valutakurser
        this.exchangeRates = data.rates || {}
      } catch (error) {
        // Hantera felmeddelanden
        this.error = error instanceof Error ? error.message : 'Unknown error'
        console.error('Failed to fetch exchange rates:', error)
      } finally {
        // Sluta ladda oavsett resultat
        this.loading = false
      }
    },
  },

  // Getters: Beräknade värden som kan nås från komponenter
  getters: {
    // Hämta en specifik valuta baserat på kod
    getExchangeRate: (state) => (currency: string) => state.exchangeRates[currency],
  },
})