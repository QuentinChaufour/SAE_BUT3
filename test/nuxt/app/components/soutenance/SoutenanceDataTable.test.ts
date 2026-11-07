import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import SoutenanceDataTable from '~/components/soutenance/SoutenanceDataTable.vue'

describe('SoutenanceDataTable.vue', () => {
    const columns = [
        { accessorKey: 'name', header: 'Nom' },
        { accessorKey: 'status', header: 'Statut' }
    ]

    function mountDataTable() {
        return mount(SoutenanceDataTable, {
            props: {
                data: [
                    { name: 'Alice Martin', status: 'Planifiée' },
                    { name: 'Bob Durand', status: 'À confirmer' }
                ],
                columns,
                searchFields: row => [row.name, row.status],
                searchPlaceholder: 'Rechercher un enseignant',
                pageSize: 5,
                emptyText: 'Aucun enseignant'
            },
            global: {
                stubs: {
                    UInput: {
                        name: 'UInput',
                        props: ['modelValue', 'placeholder'],
                        emits: ['update:modelValue'],
                        template: '<input :value="modelValue" :placeholder="placeholder" />'
                    },
                    UPagination: {
                        name: 'UPagination',
                        props: ['page', 'itemsPerPage', 'total'],
                        template: '<div />'
                    },
                    UTable: {
                        name: 'UTable',
                        props: ['data', 'columns', 'empty'],
                        template: '<div />'
                    }
                }
            }
        })
    }

    function mountWithInteractiveTable(props: Record<string, unknown> = {}) {
        const tableApi = {
            getState: () => ({ pagination: { pageIndex: 0, pageSize: 10 } }),
            getFilteredRowModel: () => ({ rows: [{}, {}] }),
            setPageIndex: vi.fn()
        }

        return {
            tableApi,
            wrapper: mount(SoutenanceDataTable, {
                props: {
                    data: [{ name: 'Alice', status: 'Planifiée' }],
                    columns,
                    ...props
                },
                global: {
                    stubs: {
                        UInput: {
                            name: 'UInput',
                            props: ['modelValue', 'placeholder'],
                            emits: ['update:modelValue'],
                            template: '<input :value="modelValue" :placeholder="placeholder" />'
                        },
                        UPagination: {
                            name: 'UPagination',
                            props: ['page', 'itemsPerPage', 'total'],
                            emits: ['update:page'],
                            template: '<div />'
                        },
                        UTable: defineComponent({
                            name: 'UTable',
                            props: ['data', 'columns', 'empty'],
                            emits: ['update:sorting', 'update:pagination'],
                            setup(_, { expose }) {
                                expose({ tableApi })
                                return () => h('div')
                            }
                        }),
                        UButton: { name: 'UButton', template: '<button><slot /></button>' },
                        UDropdownMenu: {
                            name: 'UDropdownMenu',
                            props: ['items'],
                            template: '<div><slot /></div>'
                        }
                    }
                }
            })
        }
    }

    it('renders the title, search input, and table configuration', () => {
        const wrapper = mountDataTable()
        const input = wrapper.findComponent({ name: 'UInput' })
        const table = wrapper.findComponent({ name: 'UTable' })

        expect(wrapper.text()).toContain('Soutenances enseignants')
        expect(input.props('placeholder')).toBe('Rechercher un enseignant')
        expect(table.props('data')).toHaveLength(2)
        expect(table.props('empty')).toBe('Aucun enseignant')
    })

    it('filters rows using every search term', async () => {
        const wrapper = mountDataTable()
        const input = wrapper.findComponent({ name: 'UInput' })
        const table = wrapper.findComponent({ name: 'UTable' })

        input.vm.$emit('update:modelValue', 'alice planifiée')
        await wrapper.vm.$nextTick()

        expect(table.props('data')).toEqual([
            { name: 'Alice Martin', status: 'Planifiée' }
        ])

        input.vm.$emit('update:modelValue', 'alice confirmer')
        await wrapper.vm.$nextTick()

        expect(table.props('data')).toEqual([])
    })

    it('uses the default empty data', () => {
        const wrapper = mount(SoutenanceDataTable, {
            props: { columns },
            global: {
                stubs: {
                    UTable: {
                        name: 'UTable',
                        props: ['data', 'empty'],
                        template: '<div />'
                    }
                }
            }
        })
        const table = wrapper.findComponent({ name: 'UTable' })

        expect(table.props('data')).toEqual([])
    })

    it('adds totals to non-sortable string headers', () => {
        const customHeader = () => 'custom'
        const wrapper = mountWithInteractiveTable({
            columns: [
                {
                    accessorKey: 'planned',
                    header: 'Planifiées',
                    meta: { headerTotal: '3/5' }
                },
                { accessorKey: 'custom', header: customHeader }
            ]
        }).wrapper
        const table = wrapper.findComponent({ name: 'UTable' })
        const header = table.props('columns')[0].header
        const vnode = header()

        expect(vnode.children[0]).toBe('Planifiées')
        expect(vnode.children[1].children).toBe('3/5')
        expect(table.props('columns')[1].header).toBe(customHeader)
    })

    it('keeps non-string headers unchanged', () => {
        const header = () => 'custom'
        const wrapper = mountWithInteractiveTable({
            columns: [
                { accessorKey: 'name', header },
                { accessorKey: 'status', header: 'Statut', enableSorting: false }
            ],
            sortable: true
        }).wrapper
        const table = wrapper.findComponent({ name: 'UTable' })

        expect(table.props('columns')[0].header).toBe(header)
        expect(table.props('columns')[1].header).toBe('Statut')
    })

    it('creates sortable headers and handles sorting actions', () => {
        const wrapper = mountWithInteractiveTable({
            sortable: true,
            columns: [{
                accessorKey: 'name',
                header: 'Nom',
                meta: { headerTotal: '2/4' }
            }]
        }).wrapper
        const table = wrapper.findComponent({ name: 'UTable' })
        const toggleSorting = vi.fn()
        const clearSorting = vi.fn()
        const column = {
            getIsSorted: vi.fn().mockReturnValue(false),
            toggleSorting,
            clearSorting
        }
        const header = table.props('columns')[0].header({ column })
        const menu = header.props.items
        const button = header.children.default()
        button.children.default()

        menu[0].onSelect()
        menu[1].onSelect()

        column.getIsSorted.mockReturnValue('asc')
        const ascendingHeader = table.props('columns')[0].header({ column })
        ascendingHeader.children.default().children.default()
        ascendingHeader.props.items[0].onSelect()
        column.getIsSorted.mockReturnValue('desc')
        const descendingHeader = table.props('columns')[0].header({ column })
        descendingHeader.children.default().children.default()
        descendingHeader.props.items[1].onSelect()

        expect(toggleSorting).toHaveBeenCalledWith(false)
        expect(toggleSorting).toHaveBeenCalledWith(true)
        expect(clearSorting).toHaveBeenCalledTimes(2)
    })

    it('updates the table page when pagination changes', async () => {
        const { wrapper, tableApi } = mountWithInteractiveTable()
        const pagination = wrapper.findComponent({ name: 'UPagination' })

        pagination.vm.$emit('update:page', 3)
        await wrapper.vm.$nextTick()

        expect(tableApi.setPageIndex).toHaveBeenCalledWith(2)
    })

    it('accepts table sorting and pagination updates', async () => {
        const { wrapper } = mountWithInteractiveTable()
        const table = wrapper.findComponent({ name: 'UTable' })

        table.vm.$emit('update:sorting', [{ id: 'name', desc: true }])
        table.vm.$emit('update:pagination', { pageIndex: 1, pageSize: 20 })
        await wrapper.vm.$nextTick()

        expect(table.exists()).toBe(true)
    })
})
