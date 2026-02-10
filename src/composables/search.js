import { ref, computed, watch } from 'vue';

export function useSearch(dataSource, searchableFields) {
  const searchQuery = ref('')
  const currentPage = ref(1)
  const pageSize = ref(20)

  // Filter data berdasarkan search query
  const filteredData = computed(() => {
    const data = dataSource.value
    
    if (!searchQuery.value.trim()) {
      return data
    }
    
    const query = searchQuery.value.toLowerCase()
    
    return data.filter(item => {
      return searchableFields.some(field => {
        const value = item[field]
        return value && value.toString().toLowerCase().includes(query)
      })
    })
  })

  // Pagination
  const totalItems = computed(() => filteredData.value.length)
  const totalPages = computed(() => Math.ceil(totalItems.value / pageSize.value))

  const paginatedData = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value
    const end = start + pageSize.value
    return filteredData.value.slice(start, end)
  })

  // Reset page ketika search berubah
  watch(searchQuery, () => {
    currentPage.value = 1
  })

  // Scroll to top saat ganti page
  watch(currentPage, () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  })

  return {
    searchQuery,
    currentPage,
    pageSize,
    filteredData,
    totalItems,
    totalPages,
    paginatedData
  }
}