import { UApp, UButton } from '#components'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent, h, nextTick } from 'vue'
import { describe, expect, it } from 'vitest'
import EventsManagement from '~/components/dossier/EventsManagement.vue'
import { Demarche_Source, Recherche_Stage_Status } from '~~/generated/prisma/enums'
import type { EventInfo } from '~~/shared/types/event'
import type { TimelineItem } from '@nuxt/ui'

const events: EventInfo[] = [
  {
    idDemarche: 1,
    titre: 'Premier événement',
    description: 'Premier événement',
    date: '2026-11-01',
    status: Recherche_Stage_Status.AttenteEnvoi,
    source: Demarche_Source.Email
  },
  {
    idDemarche: 2,
    titre: 'Deuxième événement',
    description: 'Deuxième événement',
    date: '2026-11-02',
    status: Recherche_Stage_Status.Entretien,
    source: Demarche_Source.Telephone
  }
]

const EventDescriptionStub = defineComponent({
  name: 'EventDescription',
  props: {
    dossierId: { type: Number, required: true },
    event: { type: Object, required: true }
  },
  emits: ['deleted', 'updated', 'close'],
  setup: () => () => h('div', 'event details')
})

const TimelineStub = defineComponent({
  name: 'UTimeline',
  props: {
    items: { type: Array, required: true }
  },
  emits: ['select'],
  setup(props, { emit }) {
    return () => h('div', [
      ...(props.items as Array<{ title: string }>).map(item => h('p', item.title)),
      h('button', {
        'data-testid': 'select-event',
        'onClick': () => emit('select', new Event('click'), events[1])
      })
    ])
  }
})

const SlideoverStub = defineComponent({
  name: 'USlideover',
  props: {
    open: { type: Boolean, default: false }
  },
  emits: ['update:open'],
  setup(props, { slots }) {
    return () => h('section', { 'data-open': props.open }, slots.body?.())
  }
})

async function mountManagement(props: { dossierId: number, events: EventInfo[] }) {
  const component = defineComponent({
    setup: () => () => h(UApp, null, {
      default: () => h(EventsManagement, props)
    })
  })

  return mountSuspended(component, {
    global: {
      stubs: {
        EventDescription: EventDescriptionStub,
        UTimeline: TimelineStub,
        USlideover: SlideoverStub
      }
    }
  })
}

describe('EventsManagement', () => {
  it('shows an empty state when there are no events', async () => {
    const wrapper = await mountManagement({ dossierId: 12, events: [] })

    expect(wrapper.text()).toContain('Aucun événement à afficher.')
    expect(wrapper.findComponent({ name: 'UTimeline' }).exists()).toBe(false)
  })

  it('renders events in their original order by default', async () => {
    const wrapper = await mountManagement({ dossierId: 12, events })
    const timeline = wrapper.findComponent({ name: 'UTimeline' })

    expect(timeline.props('items')).toEqual([
      expect.objectContaining({ title: 'Premier événement', description: 'Premier événement', icon: '' }),
      expect.objectContaining({ title: 'Deuxième événement', description: 'Deuxième événement', icon: '' })
    ])
  })

  it('reverses the timeline when the sort button is clicked', async () => {
    const wrapper = await mountManagement({ dossierId: 12, events })

    await wrapper.findComponent(UButton).trigger('click')

    expect(wrapper.findComponent({ name: 'UTimeline' }).props('items').map((item: EventInfo & TimelineItem) => item.titre))
      .toEqual(['Deuxième événement', 'Premier événement'])
  })

  it('renders the header action slot', async () => {
    const component = defineComponent({
      setup: () => () => h(UApp, null, {
        default: () => h(EventsManagement, { dossierId: 12, events }, {
          header_action: () => h('span', 'Ajouter')
        })
      })
    })
    const wrapper = await mountSuspended(component, {
      global: {
        stubs: {
          EventDescription: EventDescriptionStub,
          UTimeline: TimelineStub,
          USlideover: SlideoverStub
        }
      }
    })

    expect(wrapper.text()).toContain('Ajouter')
  })

  it('opens the selected event and passes it to the details panel', async () => {
    const wrapper = await mountManagement({ dossierId: 12, events })

    await wrapper.find('[data-testid="select-event"]').trigger('click')
    await nextTick()

    const details = wrapper.findComponent({ name: 'EventDescription' })
    expect(details.exists()).toBe(true)
    expect(details.props('dossierId')).toBe(12)
    expect(details.props('event')).toEqual(events[1])
    expect(wrapper.find('[data-open="true"]').exists()).toBe(true)
  })

  it('forwards updated events and closes the details panel', async () => {
    const wrapper = await mountManagement({ dossierId: 12, events })
    await wrapper.find('[data-testid="select-event"]').trigger('click')

    const updatedEvent = { ...events[1], titre: 'Événement modifié' }
    await wrapper.findComponent({ name: 'EventDescription' }).vm.$emit('updated', updatedEvent)
    await wrapper.findComponent({ name: 'EventDescription' }).vm.$emit('close')
    await nextTick()

    expect(wrapper.findComponent(EventsManagement).emitted('updated')).toEqual([[updatedEvent]])
    expect(wrapper.find('[data-open="true"]').exists()).toBe(false)
  })

  it('emits the selected event when it is deleted and closes the details panel', async () => {
    const wrapper = await mountManagement({ dossierId: 12, events })
    await wrapper.find('[data-testid="select-event"]').trigger('click')

    await wrapper.findComponent({ name: 'EventDescription' }).vm.$emit('deleted')
    await nextTick()

    expect(wrapper.findComponent(EventsManagement).emitted('deleted')).toEqual([[events[1]]])
    expect(wrapper.find('[data-open="true"]').exists()).toBe(false)
  })
})
