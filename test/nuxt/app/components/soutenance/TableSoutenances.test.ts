import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import TableSoutenances from '~/components/soutenance/TableSoutenances.vue'

const { useFetchMock } = vi.hoisted(() => ({
    useFetchMock: vi.fn()
}))

vi.mock('#app/composables/fetch', () => ({
    useFetch: useFetchMock
}))

describe('TableSoutenances.vue', () => {
    beforeEach(() => {
        useFetchMock.mockReturnValue({ data: { value: undefined } })
    })

    it('loads quotas for the department and passes them to the table', async () => {
        const wrapper = mount({
            components: { TableSoutenances },
            template: '<Suspense><TableSoutenances departementId="42" /></Suspense>'
        }, {
            global: {
                stubs: {
                    SoutenanceDataTable: {
                        name: 'SoutenanceDataTable',
                        props: ['data', 'columns', 'searchFields', 'searchPlaceholder', 'pageSize', 'sortable'],
                        template: '<div />'
                    }
                }
            }
        })
        await flushPromises()
        const table = wrapper.findComponent({ name: 'SoutenanceDataTable' })

        expect(table.exists()).toBe(true)
        expect(table.props('searchPlaceholder')).toBe('Rechercher un enseignant')
        expect(table.props('pageSize')).toBe(5)
        expect(table.props('sortable')).toBe('')

        expect(table.props('data')).toEqual({ value: undefined })
    })

    it('starts with no dynamic columns before quotas are available', async () => {
        const wrapper = mount({
            components: { TableSoutenances },
            template: '<Suspense><TableSoutenances departementId="1" /></Suspense>'
        }, {
            global: {
                stubs: {
                    SoutenanceDataTable: {
                        name: 'SoutenanceDataTable',
                        props: ['columns'],
                        template: '<div />'
                    }
                }
            }
        })
        await flushPromises()
        const columns = wrapper.findComponent({ name: 'SoutenanceDataTable' }).props('columns')

        expect(columns).toEqual([])
    })

    it('formats quota columns, totals, and cell values', async () => {
        useFetchMock.mockReturnValue({
            data: {
                value: [
                    {
                        teacherName: 'Alice',
                        plannedSessions: '1/2',
                        exceeded: '3/2',
                        balanced: '2/2',
                        notes: ['A', { detail: 'B', missing: null }],
                        unrated: 'invalid',
                        validDate: '2026-01-15T00:00:00.000Z',
                        emptyValue: '',
                        active: true,
                        inactive: false,
                        invalidDate: 'not-a-date'
                    },
                    {
                        teacherName: 'Bob',
                        plannedSessions: '2/3',
                        exceeded: 'invalid',
                        balanced: null,
                        notes: null,
                        validDate: null,
                        emptyValue: undefined,
                        active: false,
                        inactive: true,
                        invalidDate: 'invalid'
                    }
                ]
            }
        })

        const wrapper = mount({
            components: { TableSoutenances },
            template: '<Suspense><TableSoutenances departementId="1" /></Suspense>'
        }, {
            global: {
                stubs: {
                    SoutenanceDataTable: {
                        name: 'SoutenanceDataTable',
                        props: ['columns'],
                        template: '<div />'
                    }
                }
            }
        })
        await flushPromises()

        const columns = wrapper.findComponent({ name: 'SoutenanceDataTable' }).props('columns')
        const byKey = (key: string) => columns.find((column: { accessorKey: string }) => column.accessorKey === key)
        const cell = (key: string, value: unknown) => byKey(key).cell({
            row: { getValue: () => value }
        })

        expect(byKey('teacherName').header).toBe('Teacher Name')
        expect(byKey('plannedSessions').meta.headerTotal).toBe('3/5')
        expect(byKey('exceeded').meta.headerTotal).toBe('3/2')
        expect(byKey('balanced').meta.headerTotal).toBe('2/2')
        expect(byKey('unrated').meta.headerTotal).toBeUndefined()
        expect(cell('plannedSessions', '1/2').props.class).toBe('text-red-500')
        expect(cell('exceeded', '3/2').props.class).toBe('text-yellow-500')
        expect(cell('balanced', '2/2').props.class).toBe('text-neutral-600 dark:text-neutral-400')
        expect(cell('teacherName', 'Alice').props.class).toBe('text-neutral-600 dark:text-neutral-400')
        expect(cell('notes', ['A', { detail: 'B', missing: null }]).children).toBe('A, B')
        expect(cell('active', true).children).toBe('Oui')
        expect(cell('inactive', false).children).toBe('Non')
        expect(cell('emptyValue', '').children).toBe('N/A')
        expect(cell('notes', null).children).toBe('N/A')
        expect(cell('validDate', '2026-01-15T00:00:00.000Z').children).toBe(
            new Date('2026-01-15T00:00:00.000Z').toLocaleDateString('fr-FR')
        )
        expect(cell('invalidDate', 'invalid').children).toBe('invalid')

        useFetchMock.mockReset()
    })

    it('handles quotas becoming unavailable while building column totals', async () => {
        let reads = 0
        useFetchMock.mockReturnValue({
            data: {
                get value() {
                    reads += 1
                    return reads === 1 ? [{ teacherName: 'Alice' }] : undefined
                }
            }
        })

        const wrapper = mount({
            components: { TableSoutenances },
            template: '<Suspense><TableSoutenances departementId="1" /></Suspense>'
        }, {
            global: {
                stubs: {
                    SoutenanceDataTable: {
                        name: 'SoutenanceDataTable',
                        props: ['columns'],
                        template: '<div />'
                    }
                }
            }
        })
        await flushPromises()

        const columns = wrapper.findComponent({ name: 'SoutenanceDataTable' }).props('columns')
        expect(columns[0].meta.headerTotal).toBeUndefined()

        useFetchMock.mockReset()
    })
})
