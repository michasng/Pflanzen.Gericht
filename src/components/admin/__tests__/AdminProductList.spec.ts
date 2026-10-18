import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import AdminProductList from '@/components/admin/AdminProductList.vue'
import { createProductListItem } from '@/__tests__/createProductListItem'

const mountList = (productIds: string[], searching = false): VueWrapper =>
  mount(AdminProductList, {
    props: {
      products: productIds.map(createProductListItem),
      searching,
      hasMore: false,
      loadingMore: false,
      deletingId: null,
    },
    global: { stubs: { RouterLink: true } },
  })

describe('AdminProductList', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('given there are no products', () => {
    it('shows an empty state', () => {
      const wrapper = mountList([])

      expect(wrapper.text()).toContain('Keine Produkte vorhanden.')
    })
  })

  describe('given a search finds no products', () => {
    it('says that nothing was found', () => {
      const wrapper = mountList([], true)

      expect(wrapper.text()).toContain('Keine Produkte gefunden.')
    })
  })

  describe('given products were selected and then a search hides them', () => {
    const mountWithHiddenSelection = async (): Promise<VueWrapper> => {
      const wrapper = mountList(['a', 'b', 'c'])
      await wrapper.get('[aria-label="Product a auswählen"]').setValue(true)
      await wrapper.get('[aria-label="Product c auswählen"]').setValue(true)
      await wrapper.setProps({ products: [createProductListItem('b')], searching: true })
      return wrapper
    }

    it('still lists them as selected', async () => {
      const wrapper = await mountWithHiddenSelection()

      expect(wrapper.text()).toContain('Ausgewählt (2)')
      const productA = wrapper.get<HTMLInputElement>('[aria-label="Product a auswählen"]')
      expect(productA.element.checked).toBe(true)
    })

    it('merges them', async () => {
      const wrapper = await mountWithHiddenSelection()

      await wrapper.get('[aria-label="Produkte zusammenführen"]').trigger('click')

      expect(wrapper.emitted('merge')).toEqual([
        [createProductListItem('a'), createProductListItem('c')],
      ])
    })

    it('keeps them selected when selecting all visible products', async () => {
      const wrapper = await mountWithHiddenSelection()

      await wrapper.get('[aria-label="Alle Produkte auswählen"]').setValue(true)

      expect(wrapper.text()).toContain('Ausgewählt (3)')
    })

    it('can unselect one of them', async () => {
      const wrapper = await mountWithHiddenSelection()

      await wrapper.get('[aria-label="Product a auswählen"]').setValue(false)

      expect(wrapper.text()).toContain('Ausgewählt (1)')
    })
  })

  describe('given no product is selected', () => {
    it('disables the delete button', () => {
      const wrapper = mountList(['a', 'b'])

      const button = wrapper.get('[aria-label="Ausgewählte Produkte löschen"]')

      expect(button.attributes('disabled')).toBeDefined()
    })
  })

  describe('given one product is selected', () => {
    it('enables the delete button and disables the merge button', async () => {
      const wrapper = mountList(['a', 'b'])

      await wrapper.get('[aria-label="Product a auswählen"]').setValue(true)

      expect(
        wrapper.get('[aria-label="Ausgewählte Produkte löschen"]').attributes('disabled'),
      ).toBeUndefined()
      expect(
        wrapper.get('[aria-label="Produkte zusammenführen"]').attributes('disabled'),
      ).toBeDefined()
    })
  })

  describe('given two products are selected', () => {
    it('enables the merge button', async () => {
      const wrapper = mountList(['a', 'b'])

      await wrapper.get('[aria-label="Product a auswählen"]').setValue(true)
      await wrapper.get('[aria-label="Product b auswählen"]').setValue(true)

      expect(
        wrapper.get('[aria-label="Produkte zusammenführen"]').attributes('disabled'),
      ).toBeUndefined()
    })

    describe('when merging', () => {
      it('emits both selected products', async () => {
        const wrapper = mountList(['a', 'b', 'c'])
        await wrapper.get('[aria-label="Product a auswählen"]').setValue(true)
        await wrapper.get('[aria-label="Product c auswählen"]').setValue(true)

        await wrapper.get('[aria-label="Produkte zusammenführen"]').trigger('click')

        expect(wrapper.emitted('merge')).toEqual([
          [createProductListItem('a'), createProductListItem('c')],
        ])
      })
    })
  })

  describe('when selecting all products', () => {
    it('selects every product', async () => {
      const wrapper = mountList(['a', 'b'])

      await wrapper.get('[aria-label="Alle Produkte auswählen"]').setValue(true)

      const productA = wrapper.get<HTMLInputElement>('[aria-label="Product a auswählen"]')
      const productB = wrapper.get<HTMLInputElement>('[aria-label="Product b auswählen"]')
      expect(productA.element.checked).toBe(true)
      expect(productB.element.checked).toBe(true)
    })
  })

  describe('given all products are selected', () => {
    describe('when deselecting all products', () => {
      it('deselects every product', async () => {
        const wrapper = mountList(['a', 'b'])
        const selectAll = wrapper.get('[aria-label="Alle Produkte auswählen"]')
        await selectAll.setValue(true)

        await selectAll.setValue(false)

        const productA = wrapper.get<HTMLInputElement>('[aria-label="Product a auswählen"]')
        const productB = wrapper.get<HTMLInputElement>('[aria-label="Product b auswählen"]')
        expect(productA.element.checked).toBe(false)
        expect(productB.element.checked).toBe(false)
      })
    })
  })

  describe('given every product is selected individually', () => {
    it('checks the select all checkbox', async () => {
      const wrapper = mountList(['a', 'b'])

      await wrapper.get('[aria-label="Product a auswählen"]').setValue(true)
      await wrapper.get('[aria-label="Product b auswählen"]').setValue(true)

      const selectAll = wrapper.get<HTMLInputElement>('[aria-label="Alle Produkte auswählen"]')
      expect(selectAll.element.checked).toBe(true)
      expect(selectAll.element.indeterminate).toBe(false)
    })
  })

  describe('given some products are selected', () => {
    it('shows the select all checkbox as indeterminate', async () => {
      const wrapper = mountList(['a', 'b'])

      await wrapper.get('[aria-label="Product a auswählen"]').setValue(true)

      const selectAll = wrapper.get<HTMLInputElement>('[aria-label="Alle Produkte auswählen"]')
      expect(selectAll.element.checked).toBe(false)
      expect(selectAll.element.indeterminate).toBe(true)
    })
  })

  describe('when deleting the selected products after confirming', () => {
    it('emits every selected product after a single confirmation', async () => {
      const confirmSpy = vi.fn<() => boolean>(() => true)
      vi.stubGlobal('confirm', confirmSpy)
      const wrapper = mountList(['a', 'b', 'c'])
      await wrapper.get('[aria-label="Product a auswählen"]').setValue(true)
      await wrapper.get('[aria-label="Product c auswählen"]').setValue(true)

      await wrapper.get('[aria-label="Ausgewählte Produkte löschen"]').trigger('click')

      expect(wrapper.emitted('delete')).toEqual([[['a', 'c']]])
      expect(confirmSpy).toHaveBeenCalledTimes(1)
    })

    it('clears the selection', async () => {
      vi.stubGlobal('confirm', () => true)
      const wrapper = mountList(['a', 'b'])
      await wrapper.get('[aria-label="Product a auswählen"]').setValue(true)

      await wrapper.get('[aria-label="Ausgewählte Produkte löschen"]').trigger('click')

      expect(wrapper.text()).not.toContain('Ausgewählt (')
    })
  })

  describe('when deleting the selected products without confirming', () => {
    it('emits nothing', async () => {
      vi.stubGlobal('confirm', () => false)
      const wrapper = mountList(['a'])
      await wrapper.get('[aria-label="Product a auswählen"]').setValue(true)

      await wrapper.get('[aria-label="Ausgewählte Produkte löschen"]').trigger('click')

      expect(wrapper.emitted('delete')).toBeUndefined()
    })
  })

  describe('when deleting a single product after confirming', () => {
    it('emits only that product', async () => {
      vi.stubGlobal('confirm', () => true)
      const wrapper = mountList(['a', 'b'])

      await wrapper.findAll('[aria-label="Produkt löschen"]')[1]?.trigger('click')

      expect(wrapper.emitted('delete')).toEqual([[['b']]])
    })
  })
})
